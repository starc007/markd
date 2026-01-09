import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const FileIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19V8C22 7.44772 21.5523 7 21 7H15C13.8954 7 13 6.10457 13 5V2H5ZM15 2.58579L19.4142 7H15V2.58579ZM11 4V5C11 6.10457 11.8954 7 13 7H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5C4 4.44772 4.44772 4 5 4H11Z"
        fill="currentColor"
      />
    </svg>
  );
});

FileIcon.displayName = "FileIcon";
