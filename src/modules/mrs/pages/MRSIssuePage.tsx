import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';

export default function MRSIssuePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    navigate(`/stock-movement/create?mrsId=${id}`, { replace: true });
  }, [id, navigate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Issue Materials"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/mrs' },
          { label: 'Issue' },
        ]}
      />
      <p className="text-sm text-muted-foreground">Redirecting to stock movement issue form...</p>
    </div>
  );
}
