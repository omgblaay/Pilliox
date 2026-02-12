import { CalendarView } from "../components/CalendarView";

interface CalendarPageProps {
  accessToken: string;
  onLogout: () => void;
  projectId: string;
  anonKey: string;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export default function CalendarPage(props: CalendarPageProps) {
  return <CalendarView {...props} />;
}
