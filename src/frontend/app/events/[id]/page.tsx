import EventDetailPage from "@/components/event-detail-page";

type PageContext = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailRoute(context: PageContext) {
  const { id } = await context.params;

  return <EventDetailPage eventId={id} />;
}
