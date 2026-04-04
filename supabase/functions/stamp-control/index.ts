import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACCURACY_THRESHOLDS: Record<string, number> = {
  easy: 50, moderate: 30, hard: 20, expert: 15
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const body = await req.json()
  const { control_id, lat, lng, accuracy_m, photo_voi_id } = body

  if (!control_id || lat == null || lng == null || accuracy_m == null) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 })
  }

  // 1. Fetch control + course (includes requires_premium)
  const { data: control, error: ctrlErr } = await supabase
    .from('orienteering_controls')
    .select('*, orienteering_courses!orienteering_controls_course_id_fkey(id, course_type, is_public, requires_premium, creator_id)')
    .eq('id', control_id)
    .single()

  if (ctrlErr || !control) {
    return new Response(JSON.stringify({ error: 'control_not_found' }), { status: 404 })
  }

  const course = control.orienteering_courses

  // 2. Check access
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, is_curator')
    .eq('id', user.id)
    .single()

  let hasAccess =
    course.is_public ||
    course.creator_id === user.id ||
    profile?.is_curator ||
    (course.requires_premium ? profile?.is_premium : false)

  if (!hasAccess) {
    const { data: accessRow } = await supabase
      .from('course_access')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .maybeSingle()
    hasAccess = !!accessRow
  }

  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'not_premium' }), { status: 403 })
  }

  // 3. Distance validation
  const distance = haversine(lat, lng, control.lat, control.lng)
  if (distance > control.radius_m) {
    return new Response(JSON.stringify({
      error: 'outside_geofence',
      distance_m: Math.round(distance),
      radius_m: control.radius_m
    }), { status: 422 })
  }

  // 4. GPS accuracy
  const threshold = ACCURACY_THRESHOLDS[control.difficulty] ?? 50
  if (accuracy_m > threshold) {
    return new Response(JSON.stringify({
      error: 'gps_accuracy_too_low',
      accuracy_m,
      required_m: threshold
    }), { status: 422 })
  }

  // 5. Already stamped?
  const { data: existing } = await supabase
    .from('control_stamps')
    .select('id')
    .eq('user_id', user.id)
    .eq('control_id', control_id)
    .maybeSingle()

  if (existing) {
    return new Response(JSON.stringify({ error: 'already_stamped' }), { status: 409 })
  }

  // 6. Sequential: correct order?
  if (course.course_type === 'sequential' && control.order_index > 0) {
    const { data: prevStamp } = await supabase
      .from('control_stamps')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .in('control_id',
        (await supabase
          .from('orienteering_controls')
          .select('id')
          .eq('course_id', course.id)
          .eq('order_index', control.order_index - 1)
        ).data?.map((c: { id: string }) => c.id) ?? []
      )
      .maybeSingle()

    if (!prevStamp) {
      return new Response(JSON.stringify({ error: 'wrong_order' }), { status: 422 })
    }
  }

  // 7. Photo required?
  if (control.requires_photo && !photo_voi_id) {
    return new Response(JSON.stringify({ error: 'photo_required' }), { status: 422 })
  }

  // 8. INSERT stamp (service_role, bypass RLS)
  const { data: stamp, error: stampErr } = await supabase
    .from('control_stamps')
    .insert({
      user_id: user.id,
      control_id,
      course_id: course.id,
      lat, lng,
      accuracy_m,
      voi_id: photo_voi_id ?? null,
    })
    .select('id')
    .single()

  if (stampErr) {
    return new Response(JSON.stringify({ error: 'stamp_failed', detail: stampErr.message }), { status: 500 })
  }

  // 9. Fetch total number of controls in course
  const { count: totalControls } = await supabase
    .from('orienteering_controls')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', course.id)

  // 10. UPSERT course_progress
  const { data: progress } = await supabase
    .from('course_progress')
    .select('stamp_count')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const newCount = (progress?.stamp_count ?? 0) + 1
  const courseCompleted = newCount >= (totalControls ?? 0)

  await supabase.from('course_progress').upsert({
    user_id: user.id,
    course_id: course.id,
    stamp_count: newCount,
    total_controls: totalControls ?? 0,
    completed_at: courseCompleted ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,course_id' })

  // 11. Find next control for Sequential
  let nextControlId: string | null = null
  if (course.course_type === 'sequential') {
    const { data: next } = await supabase
      .from('orienteering_controls')
      .select('id')
      .eq('course_id', course.id)
      .eq('order_index', (control.order_index ?? 0) + 1)
      .single()
    nextControlId = next?.id ?? null
  }

  return new Response(JSON.stringify({
    success: true,
    stamp_id: stamp.id,
    course_completed: courseCompleted,
    next_control_id: nextControlId,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
