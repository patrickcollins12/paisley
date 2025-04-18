import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"


const colorsx = ["red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose"];

// const inputString = `
// bg-\${color}-400/30
// text-\${color}-600
// text-\${color}-400
// hover:bg-\${color}-400/10
// hover:bg-\${color}-400/80 
// hover:text-\${color}-900 
// dark:hover:bg-\${color}-800 
// dark:hover:text-\${color}-300
// `;
// // Remove leading/trailing whitespace and split the string into an array at each newline
// const stringsArray = inputString.trim().split('\n');
// let arr = [];
// colorsx.forEach((color) => {
//   stringsArray.map((string) => {
//     // Replace `${color}` in each string with the current color
//     arr.push(string.replace(/\${color}/g, color));
//   });
// });

// for (let i of arr) {
//   console.log(`"${i}",`);
// }


// Generated tailwind colors from the above. 
// Needed for dynamic colors use below
const colors_badge = [
  "bg-red-400/30",
  "text-red-600",
  "text-red-400",
  "hover:bg-red-400/10",
  "hover:bg-red-400/80 ",
  "hover:text-red-900 ",
  "dark:hover:bg-red-800 ",
  "dark:hover:text-red-300",
  "bg-orange-400/30",
  "text-orange-600",
  "text-orange-400",
  "hover:bg-orange-400/10",
  "hover:bg-orange-400/80 ",
  "hover:text-orange-900 ",
  "dark:hover:bg-orange-800 ",
  "dark:hover:text-orange-300",
  "bg-amber-400/30",
  "text-amber-600",
  "text-amber-400",
  "hover:bg-amber-400/10",
  "hover:bg-amber-400/80 ",
  "hover:text-amber-900 ",
  "dark:hover:bg-amber-800 ",
  "dark:hover:text-amber-300",
  "bg-yellow-400/30",
  "text-yellow-600",
  "text-yellow-400",
  "hover:bg-yellow-400/10",
  "hover:bg-yellow-400/80 ",
  "hover:text-yellow-900 ",
  "dark:hover:bg-yellow-800 ",
  "dark:hover:text-yellow-300",
  "bg-lime-400/30",
  "text-lime-600",
  "text-lime-400",
  "hover:bg-lime-400/10",
  "hover:bg-lime-400/80 ",
  "hover:text-lime-900 ",
  "dark:hover:bg-lime-800 ",
  "dark:hover:text-lime-300",
  "bg-green-400/30",
  "text-green-600",
  "text-green-400",
  "hover:bg-green-400/10",
  "hover:bg-green-400/80 ",
  "hover:text-green-900 ",
  "dark:hover:bg-green-800 ",
  "dark:hover:text-green-300",
  "bg-emerald-400/30",
  "text-emerald-600",
  "text-emerald-400",
  "hover:bg-emerald-400/10",
  "hover:bg-emerald-400/80 ",
  "hover:text-emerald-900 ",
  "dark:hover:bg-emerald-800 ",
  "dark:hover:text-emerald-300",
  "bg-teal-400/30",
  "text-teal-600",
  "text-teal-400",
  "hover:bg-teal-400/10",
  "hover:bg-teal-400/80 ",
  "hover:text-teal-900 ",
  "dark:hover:bg-teal-800 ",
  "dark:hover:text-teal-300",
  "bg-cyan-400/30",
  "text-cyan-600",
  "text-cyan-400",
  "hover:bg-cyan-400/10",
  "hover:bg-cyan-400/80 ",
  "hover:text-cyan-900 ",
  "dark:hover:bg-cyan-800 ",
  "dark:hover:text-cyan-300",
  "bg-sky-400/30",
  "text-sky-600",
  "text-sky-400",
  "hover:bg-sky-400/10",
  "hover:bg-sky-400/80 ",
  "hover:text-sky-900 ",
  "dark:hover:bg-sky-800 ",
  "dark:hover:text-sky-300",
  "bg-blue-400/30",
  "text-blue-600",
  "text-blue-400",
  "hover:bg-blue-400/10",
  "hover:bg-blue-400/80 ",
  "hover:text-blue-900 ",
  "dark:hover:bg-blue-800 ",
  "dark:hover:text-blue-300",
  "bg-indigo-400/30",
  "text-indigo-600",
  "text-indigo-400",
  "hover:bg-indigo-400/10",
  "hover:bg-indigo-400/80 ",
  "hover:text-indigo-900 ",
  "dark:hover:bg-indigo-800 ",
  "dark:hover:text-indigo-300",
  "bg-violet-400/30",
  "text-violet-600",
  "text-violet-400",
  "hover:bg-violet-400/10",
  "hover:bg-violet-400/80 ",
  "hover:text-violet-900 ",
  "dark:hover:bg-violet-800 ",
  "dark:hover:text-violet-300",
  "bg-purple-400/30",
  "text-purple-600",
  "text-purple-400",
  "hover:bg-purple-400/10",
  "hover:bg-purple-400/80 ",
  "hover:text-purple-900 ",
  "dark:hover:bg-purple-800 ",
  "dark:hover:text-purple-300",
  "bg-fuchsia-400/30",
  "text-fuchsia-600",
  "text-fuchsia-400",
  "hover:bg-fuchsia-400/10",
  "hover:bg-fuchsia-400/80 ",
  "hover:text-fuchsia-900 ",
  "dark:hover:bg-fuchsia-800 ",
  "dark:hover:text-fuchsia-300",
  "bg-pink-400/30",
  "text-pink-600",
  "text-pink-400",
  "hover:bg-pink-400/10",
  "hover:bg-pink-400/80 ",
  "hover:text-pink-900 ",
  "dark:hover:bg-pink-800 ",
  "dark:hover:text-pink-300",
  "bg-rose-400/30",
  "text-rose-600",
  "text-rose-400",
  "hover:bg-rose-400/10",
  "hover:bg-rose-400/80 ",
  "hover:text-rose-900 ",
  "dark:hover:bg-rose-800 ",
  "dark:hover:text-rose-300",
    
]

// Simple Hash Function to convert a string into a number
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash); // Ensure it's always positive
}

// Function to get color for a string
function getColorForString(str) {
  if (typeof str !== "string") return "";
  const hash = hashString(str);
  const colorIndex = hash % colorsx.length; // Use modulo to map hash to color array index
  return colorsx[colorIndex];
}

const badgeVariants = cva(
  "inline-flex items-center text-nowrap rounded-full border px-2.5 mr-1 mb-1 py-0.5 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 font-semibold",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 font-semibold",
        colored:
          "border-transparent font-semibold",
        outline: "text-foreground font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function generateColoredClassNames(string_to_color) {
  const color = getColorForString(string_to_color);
  var className = ` bg-${color}-400/30`
  className    += ` text-${color}-600`
  className    += ` hover:bg-${color}-400/10 `
  return className
}

// text-blue-400 hover:bg-blue-400/80 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-300
function generateDismissableColoredClassNames(string_to_color) {
  const color = getColorForString(string_to_color);
  var className = ` text-${color}-400`
  className    += ` hover:bg-${color}-400/80`
  className    += ` hover:text-${color}-900`
  className    += ` dark:hover:bg-${color}-800`
  className    += ` dark:hover:text-${color}-300 `
  return className
}


function Badge({
  className,
  variant,
  ...props
}) {


  if (variant === "colored") {
    if (!className) { className = "" }
    className += generateColoredClassNames(props["children"]);
  }
  // "bg-red-400/30 text-red-600 hover:bg-red-400/10"

  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}




// https://flowbite.com/docs/components/badge/#chips-dismissible-badges
// this is a dogs breakfast, can it be cleaned up to use cva an the above?
function BadgeDismissable({
  className,
  variant,
  label,
  ...props
}) {

  var color = ""
  if (variant === "colored") {
    color = getColorForString(label);
    if (!className) { className = "" }
    className += ` bg-${color}-400/30`
    className += ` text-${color}-600`
    // className += ` hover:bg-${color}-400/10`
  }

  className += " inline-flex items-center pl-2 pr-1 py-1 m-0.5 text-xs rounded-full font-semibold "

  var buttonClassName = `inline-flex items-center p-1 ml-1 text-sm bg-transparent rounded-full text-${color}-400 hover:bg-${color}-400/80 hover:text-${color}-900 dark:hover:bg-${color}-800 dark:hover:text-${color}-300`

  return (
    <span id="badge-dismiss-default" className={className} {...props}>
      {label}
      <button type="button" className={buttonClassName} data-dismiss-target="#badge-dismiss-default" aria-label="Remove">
        <svg className="w-2 h-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
        <span className="sr-only">Remove badge</span>
      </button>
    </span>
  );
}

export { Badge, BadgeDismissable, badgeVariants, colorsx, generateColoredClassNames, generateDismissableColoredClassNames }
