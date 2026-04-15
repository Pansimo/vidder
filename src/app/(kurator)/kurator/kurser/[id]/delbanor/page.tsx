import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SubCourseList from './SubCourseList'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DelbanorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('orienteering_courses')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: subCourses } = await supabase
    .from('orienteering_sub_courses')
    .select('*')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  // Count controls per sub-course
  const { data: controls } = await supabase
    .from('orienteering_controls')
    .select('id, sub_course_id')
    .eq('course_id', id)

  const controlCounts: Record<string, number> = {}
  for (const c of controls ?? []) {
    if (c.sub_course_id) {
      controlCounts[c.sub_course_id] = (controlCounts[c.sub_course_id] ?? 0) + 1
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Delbanor</h1>
      <p className="mb-6 text-sm text-gray-500">{course.name}</p>

      <SubCourseList
        courseId={id}
        initialSubCourses={subCourses ?? []}
        controlCounts={controlCounts}
      />
    </div>
  )
}
