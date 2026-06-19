/**
 * index.ts — public barrel for the dumb, domain-agnostic UI primitives.
 *
 * Import as: `import { Button, Input, Card } from '@/components/ui';`
 * These components never import feature code (ARCHITECTURE.md §2: components/ui is a leaf).
 */

export { Button } from './Button';
export { buttonVariants, type ButtonVariantProps } from './button-variants';
export type { ButtonProps, LabelledButtonProps, IconOnlyButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Chip } from './Chip';
export type { ChipProps } from './Chip';

export { Card } from './Card';
export type { CardProps, CardButtonProps, AnyCardProps } from './Card';

export { Badge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';

export { Avatar, avatarVariants } from './Avatar';
export type { AvatarProps } from './Avatar';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Skeleton, skeletonVariants } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { RatingStars } from './RatingStars';
export type { RatingStarsProps } from './RatingStars';

export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
