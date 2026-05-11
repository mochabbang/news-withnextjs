import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewsItemSkeleton() {
    return (
        <Card className="flex overflow-hidden">
            <Skeleton className="w-32 shrink-0 aspect-video sm:w-40" />
            <CardContent className="flex-1 p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3 mt-2" />
            </CardContent>
        </Card>
    );
}
