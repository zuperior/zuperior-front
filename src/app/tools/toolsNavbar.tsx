import Image from "next/image";
import Link from "next/link";

const ToolNavbar = () => {
  return (
    <div className="flex items-center gap-3 flex-1 translate-x-2">
      <Link href={"/"} className="flex items-center cursor-pointer">
        <Image
          alt="Zuperior Logo"
          src="/logo.png"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
        <span className="text-4xl font-bold tracking-tight dark:text-white/75">
          Zuperior
        </span>
      </Link>
    </div>
  );
}

export default ToolNavbar;