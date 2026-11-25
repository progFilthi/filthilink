'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SubscriptionService } from '@/lib/api/subscription.service';
import { useAuthStore } from '@/store/auth-store';
import {
  PRICING,
  PRO_FEATURES,
  yearlyPerMonth,
  yearlySavingsPercent,
} from '@/lib/pricing';
import { cn } from '@/lib/utils';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Why the dialog opened, e.g. the message the API sent when a limit was hit. */
  description?: string;
}

export function UpgradeDialog({ open, onOpenChange, description }: UpgradeDialogProps) {
  const { email } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!email) {
      toast.error('Email address not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Initiating secure checkout...');

    try {
      const response = await SubscriptionService.createCheckout(email, { billingCycle });
      if (response.checkoutUrl) {
        toast.success('Redirecting to checkout...', { id: toastId });
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Failed to initiate checkout. Please try again.';
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const price =
    billingCycle === 'MONTHLY'
      ? `$${PRICING.monthly}/month`
      : `$${PRICING.yearly}/year ($${yearlyPerMonth}/mo)`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keep your links for good</DialogTitle>
          <DialogDescription>
            {description ??
              'Pro links never expire, and upgrading brings back any links that have already expired.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="inline-flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
            {(['MONTHLY', 'YEARLY'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                  billingCycle === cycle
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {cycle === 'MONTHLY' ? 'Monthly' : `Yearly (-${yearlySavingsPercent}%)`}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-2.5 text-sm">
                <IconCheck className="h-4 w-4 shrink-0 text-primary" />
                <span className={feature.soon ? 'text-muted-foreground' : undefined}>
                  {feature.label}
                </span>
                {feature.soon && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Maybe later
          </Button>
          <Button onClick={handleUpgrade} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <LoadingSpinner className="text-primary-foreground" />
            ) : (
              `Upgrade · ${price}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
