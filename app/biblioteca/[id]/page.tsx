import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

// La biblioteca comparte la vista de detalle con "Mis casos".
export default async function BibliotecaDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/cases/${id}`);
}
