import { ProtectedLayout } from "@/components/protected/ProtectedLayout";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
