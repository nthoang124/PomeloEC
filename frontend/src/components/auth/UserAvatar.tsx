import Image from "next/image";
import { auth } from "@/auth";

export default async function UserAvatar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 rounded-full bg-slate-100 py-1.5 px-3 pr-2">
      <span className="text-sm font-medium text-slate-700">
        {session.user.name || session.user.email}
      </span>
      {session.user.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name || "User Avatar"}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white font-bold">
          {session.user.email?.[0]?.toUpperCase() || "U"}
        </div>
      )}
    </div>
  );
}
