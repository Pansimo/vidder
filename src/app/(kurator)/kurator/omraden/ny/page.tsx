import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '../../../_components/Breadcrumb'
import OmradeForm from '../OmradeForm'

export default async function NyttOmradePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  // Get macro areas for parent select
  const { data: macroAreas } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('level', 1)
    .order('name')

  return (
    <div className="p-6 max-w-6xl">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: 'Nytt område' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Nytt område</h1>
      <OmradeForm
        mode="create"
        isAdmin={profile?.is_admin ?? false}
        parentOptions={macroAreas ?? []}
      />
    </div>
  )
}
