import { AdminLayoutClient } from "./AdminLayoutClient";
import { UTApi } from "uploadthing/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const metadata = {
  title: "Admin Dashboard — SRC e-solutions",
};

async function StorageWidget() {
  const utapi = new UTApi();
  let utPercent = 0;
  let pgPercent = 0;
  
  try {
    const usage = await utapi.getUsageInfo();
    const LIMIT_2_GB = 2 * 1024 * 1024 * 1024; // 2GB limit for Free Tier UploadThing
    utPercent = Math.min(100, Math.round((usage.totalBytes / LIMIT_2_GB) * 100));
  } catch (e) {
    console.error("Failed to fetch uploadthing usage:", e);
  }

  try {
    const result = await db.execute(sql`SELECT pg_database_size('neondb') as size`);
    // Neon serverless driver returns rows inside a 'rows' property, while standard pg returns an array directly.
    const rows = (result as any).rows || result;
    const sizeInBytes = Number(rows[0]?.size || 0);
    const LIMIT_1_GB = 1 * 1024 * 1024 * 1024; // 1GB limit for Free Tier Neon
    pgPercent = Math.min(100, Math.round((sizeInBytes / LIMIT_1_GB) * 100));
  } catch (e) {
    console.error("Failed to fetch neon db usage:", e);
  }

  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  
  const getCircleProps = (percent: number) => {
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    const color = percent > 90 ? "#ef4444" : percent > 75 ? "#f59e0b" : "#22c55e";
    return { strokeDashoffset, color };
  };

  const utProps = getCircleProps(utPercent);
  const pgProps = getCircleProps(pgPercent);

  return (
    <div className="flex items-center gap-2 sm:gap-3 mr-2 sm:mr-6">
      {/* Database Storage Widget */}
      <div className="relative group flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 shadow-sm cursor-help">
        <svg width="20" height="20" viewBox="0 0 20 20" className="transform -rotate-90">
          <circle cx="10" cy="10" r={radius} stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
          <circle
            cx="10" cy="10" r={radius} stroke={pgProps.color} strokeWidth="2.5" fill="none"
            strokeDasharray={circumference} strokeDashoffset={pgProps.strokeDashoffset} strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">
          DB: {pgPercent}%
        </span>
        
        {/* Custom Styled Tooltip */}
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-3 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 text-left">
          <h4 className="font-semibold text-gray-900 text-xs mb-1">System Data</h4>
          <p className="text-gray-500 text-[11px] leading-tight mb-2">
            <strong>Stores:</strong> Text information like project requests, orders, and user accounts.
          </p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Usage</span>
            <span className="font-semibold text-xs text-gray-700">{pgPercent}% of 1GB</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pgPercent}%`, backgroundColor: pgProps.color }}></div>
          </div>
          <p className="text-rose-600 text-[10px] leading-snug">
            <strong>If full:</strong> You won't be able to receive new project requests. You will need to delete old records or upgrade your server plan.
          </p>
        </div>
      </div>

      {/* Files Storage Widget */}
      <div className="relative group flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 shadow-sm cursor-help">
        <svg width="20" height="20" viewBox="0 0 20 20" className="transform -rotate-90">
          <circle cx="10" cy="10" r={radius} stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
          <circle
            cx="10" cy="10" r={radius} stroke={utProps.color} strokeWidth="2.5" fill="none"
            strokeDasharray={circumference} strokeDashoffset={utProps.strokeDashoffset} strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">
          Files: {utPercent}%
        </span>

        {/* Custom Styled Tooltip */}
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-3 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 text-left">
          <h4 className="font-semibold text-gray-900 text-xs mb-1">File Storage</h4>
          <p className="text-gray-500 text-[11px] leading-tight mb-2">
            <strong>Stores:</strong> Uploaded images, documents, and project attachments.
          </p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Usage</span>
            <span className="font-semibold text-xs text-gray-700">{utPercent}% of 2GB</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${utPercent}%`, backgroundColor: utProps.color }}></div>
          </div>
          <p className="text-rose-600 text-[10px] leading-snug">
            <strong>If full:</strong> Users won't be able to upload new files. You will need to delete old files or upgrade your storage plan.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient 
      storageWidget={
        <Suspense fallback={<div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse mr-6"></div>}>
          <StorageWidget />
        </Suspense>
      }
    >
      {children}
    </AdminLayoutClient>
  );
}
