import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ControlEditor from './ControlEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function KontrollerPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('orienteering_courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: controls } = await supabase
    .from('orienteering_controls')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  const { data: subCourses } = await supabase
    .from('orienteering_sub_courses')
    .select('id, name')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  return (
    <ControlEditor
      course={course}
      initialControls={controls ?? []}
      subCourses={subCourses ?? []}
    />
  )
}
