import { createClient } from '@/lib/supabase/server'
import Breadcrumb from '../../../_components/Breadcrumb'
import AreaChooser from './AreaChooser'

interface Props {
  searchParams: Promise<{ macro?: string }>
}

export default async function NyPoiValjOmradePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: macroAreas } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('level', 1)
    .order('name')

  // Fetch sub-areas for selected macro (if any)
  let subAreas: { id: string; name: string }[] = []
  if (params.macro) {
    const { data } = await supabase
      .from('curated_areas')
      .select('id, name')
      .eq('level', 2)
      .eq('parent_area_id', params.macro)
      .order('name')

    subAreas = data ?? []
  }

  return (
    <div className="p-6 max-w-lg">
      <Breadcrumb items={[
        { label: 'POI:er', href: '/kurator/poi' },
        { label: 'Ny POI' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Ny POI — välj område</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <AreaChooser
          macroAreas={macroAreas ?? []}
          subAreas={subAreas}
        />
      </div>
    </div>
  )
}
