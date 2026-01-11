import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const BackspaceIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 10L16 14"
        stroke="currentColor"
        strokeWidth="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16 10L12 14"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M21 9.648C21 5.82037 20.1796 5 16.352 5H10.7515C10.267 5 9.79904 5.17584 9.43446 5.49485L3.72017 10.4948C2.80952 11.2917 2.80952 12.7083 3.72018 13.5052L9.43446 18.5052C9.79904 18.8242 10.267 19 10.7515 19H16.352C20.1796 19 21 18.1796 21 14.352V9.648Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  );
});

BackspaceIcon.displayName = "BackspaceIcon";
