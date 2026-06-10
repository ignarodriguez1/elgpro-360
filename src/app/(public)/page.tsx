import { HomeDesktop } from "@/components/public/HomeDesktop";
import { HomeMobile } from "@/components/public/HomeMobile";

export default function HomePage() {
  return (
    <>
      <div className="only-desktop"><HomeDesktop /></div>
      <div className="only-mobile"><HomeMobile /></div>
    </>
  );
}
