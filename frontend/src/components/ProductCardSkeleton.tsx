import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
export default function ProductCardSkeleton(){return <div className="h-full min-h-[382px] bg-white p-3"><Skeleton className="aspect-square" height="auto"/><Skeleton width="35%" className="mt-3"/><Skeleton count={2}/><Skeleton width="55%" className="mt-4"/><Skeleton height={38} className="mt-3"/></div>}
