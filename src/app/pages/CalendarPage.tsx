import { CalendarView } from "../components/CalendarView";

interface CalendarPageProps {
  accessToken: string;
  projectId: string;
  anonKey: string;
}

export default function CalendarPage(props: CalendarPageProps) {
  return <CalendarView {...props} />;
}
