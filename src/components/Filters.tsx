import { Button } from "@heroui/react";
import { useState } from "react";

export enum FilterType {
  Trailer = "trailer",
  Numbered = "numbered",
  Unnumbered = "unnumbered",
  Extras = "extras",
  Unwatched = "unwatched",
}

const CheckIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const DotIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      focusable="false"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
};

export function Filter({
  type,
  onFilterChange,
  defaultChecked,
}: {
  type: FilterType;
  onFilterChange: (type: FilterType, checked: boolean) => void;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <Button
      style={{
        display: "inline-block",
        margin: "0.5rem",
        padding: "0.5rem 1rem",
        backgroundColor: checked ? "#feea3b" : "#000",
        color: checked ? "#000" : "white",
        border: "2px solid #feea3b",
        borderRadius: "20px",
        cursor: "pointer",
        userSelect: "none",
      }}
      onPress={() => {
        const newChecked = !checked;
        onFilterChange(type, newChecked);
        setChecked(newChecked);
      }}
    >
      {checked ? (
        <CheckIcon
          style={{
            display: "inline-block",
            marginRight: "0.5rem",
          }}
        />
      ) : (
        <DotIcon
          style={{
            display: "inline-block",
            marginRight: "0.5rem",
          }}
        />
      )}
      <span>{type.substring(0, 1).toUpperCase() + type.slice(1)}</span>
    </Button>
  );
}

export default function Filters({
  defaultFilters = [],
  onFilterChange,
}: {
  defaultFilters: FilterType[];
  onFilterChange: (type: FilterType, checked: boolean) => void;
}) {
  return (
    <>
      {[
        FilterType.Trailer,
        FilterType.Numbered,
        FilterType.Unnumbered,
        FilterType.Extras,
        FilterType.Unwatched,
      ].map((type) => {
        return (
          <Filter
            key={type}
            defaultChecked={defaultFilters.includes(type)}
            type={type}
            onFilterChange={onFilterChange}
          />
        );
      })}
    </>
  );
}
