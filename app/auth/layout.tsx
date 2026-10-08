interface LayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-16">
      {children}
    </div>
  );
}
