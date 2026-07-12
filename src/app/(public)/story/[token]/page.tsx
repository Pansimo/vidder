import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function StoryRedirect({ params }: PageProps) {
  const { token } = await params;
  permanentRedirect(`/s/${token}`);
}
