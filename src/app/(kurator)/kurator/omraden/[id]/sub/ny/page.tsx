import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Breadcrumb from '../../../../../_components/Breadcrumb'
import OmradeForm from '../../../OmradeForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NyttSubOmradePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: macro } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!macro) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  // Macro areas for parent select
  const { data: macroAreas } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('level', 1)
    .order('name')

  return (
    <div className="p-6 max-w-6xl">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden', href: `/kurator/omraden/${id}/sub` },
        { label: 'Nytt subområde' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Nytt subområde i {macro.name}</h1>
      <OmradeForm
        mode="create"
        isAdmin={profile?.is_admin ?? false}
        parentOptions={macroAreas ?? []}
        defaultLevel={2}
        defaultParentId={id}
      />
    </div>
  )
}
