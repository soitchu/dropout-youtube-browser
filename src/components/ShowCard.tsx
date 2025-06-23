import { useMemo } from "react";
import type { Episode, Show } from "../types";

import { Card, CardBody, Image, CardFooter, PressEvent } from "@heroui/react";

export default function ShowCard({
  show,
  onClick,
}: {
  show: Show | Episode;
  onClick: Function;
}) {
  // const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const lastUpdateAt = useMemo(() => {
    if (!("lastUpdatedAt" in show)) {
      show.lastUpdatedAt = new Date((show as Episode).publishedAt);
    }

    const currentTimestamp = new Date().getTime();
    const lastUpdateTimestamp = show.lastUpdatedAt?.getTime() || 0;
    const diff = currentTimestamp - lastUpdateTimestamp;

    if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
      return "Today";
    } else if (diff >= 24 * 60 * 60 * 1000 && diff < 7 * 24 * 60 * 60 * 1000) {
      const daysAgo = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
    }

    return show.lastUpdatedAt?.toDateString() || "Unknown";
  }, [show]);

  const thumbnailUrl =
    ("thumbnail" in show ? show.thumbnail.url : show.thumbnails?.url) ?? "";

  return (
    <>
      <Card
        isPressable
        className="w-[300px] m-3 inline-block bg-[#feea3b]"
        shadow="sm"
        onContextMenu={() => console.log("item context menu")}
        onPress={onClick as (e: PressEvent) => void}
      >
        <CardBody className="overflow-visible p-0">
          <Image
            alt={show.title}
            className="w-full object-cover h-[140px]"
            radius="lg"
            shadow="sm"
            src={thumbnailUrl}
            width="100%"
          />
        </CardBody>
        <CardFooter className="text-small justify-between bg-[#feea3b] block">
          <b>{show.title}</b>
          <p>{lastUpdateAt}</p>
        </CardFooter>
      </Card>
    </>
  );
}
