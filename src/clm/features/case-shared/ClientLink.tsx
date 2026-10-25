import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Entity } from '@/domain/types';

export const CLIENT_TYPE_LABEL = { borrower: 'Borrower', qualified_investor: 'Qualified Investor' } as const;

/** Client name link → entity view (UC001: "Client Name (click will navigate to company profile)"). */
export function ClientLink({ entity, className }: { entity: Entity; className?: string }) {
  return (
    <Link to={`/entities/${entity.id}`} onClick={(e) => e.stopPropagation()} className={clsx('link bidi block max-w-full truncate text-left', className)} title={entity.nameAr}>
      {entity.nameAr}
    </Link>
  );
}
