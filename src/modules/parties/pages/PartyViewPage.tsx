import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { useParties } from '../hooks/useParties';

export default function PartyViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allParties } = useParties();
  const party = allParties.find((p) => p.id === id);

  if (!party) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/parties')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Party not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={party.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters', href: '/parties' },
          { label: 'Party Details' },
        ]}
        action={(
          <Button variant="outline" onClick={() => navigate('/parties')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      />

      <FormSection title="Party Details">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Party Name</div>
            <div className="font-medium">{party.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium capitalize">{party.partyType}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium">{party.isActive ? 'Active' : 'Inactive'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Contact Person</div>
            <div className="font-medium">{party.contactPerson || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{party.phone || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Alt Phone</div>
            <div className="font-medium">{party.altPhone || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Email</div>
            <div className="font-medium">{party.email || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">GST No</div>
            <div className="font-medium">{party.gstNumber || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">PAN No</div>
            <div className="font-medium">{party.panNumber || '-'}</div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Address">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Address Line 1</div>
            <div className="font-medium">{party.address1 || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Address Line 2</div>
            <div className="font-medium">{party.address2 || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">City</div>
            <div className="font-medium">{party.city || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">State</div>
            <div className="font-medium">{party.state || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Pincode</div>
            <div className="font-medium">{party.pincode || '-'}</div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Accounts">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Opening Balance</div>
            <div className="font-medium">Rs. {party.openingBalance?.toLocaleString('en-IN') || '0'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Credit Limit</div>
            <div className="font-medium">Rs. {party.creditLimit?.toLocaleString('en-IN') || '0'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Remarks</div>
            <div className="font-medium">{party.remarks || '-'}</div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
