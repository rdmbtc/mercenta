/**
 * Slot-machine number display. Each digit is a column of 0–9 that translates to the target digit,
 * so changes roll instead of jumping. Pure markup plus a transform per digit; renders identically on the server.
 */
export default function Odometer({ value, className }: { value: string; className?: string }) {
  const chars = value.split("");
  const count = chars.length;
  return (
    <span className={"odo" + (className ? " " + className : "")} aria-label={value}>
      {chars.map((char, index) => {
        // Key by position from the right so digits keep their column when the number gains a digit.
        const key = count - index;
        if (!/\d/.test(char)) {
          return (
            <span key={"s" + key} className="odo-static" aria-hidden="true">
              {char}
            </span>
          );
        }
        const digit = Number(char);
        return (
          <span key={"d" + key} className="odo-digit" aria-hidden="true">
            <span
              className="odo-col"
              style={{ transform: "translate3d(0," + -digit * 10 + "%,0)", transitionDelay: (count - index) * 28 + "ms" }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
