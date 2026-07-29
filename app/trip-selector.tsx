"use client";

import { usePathname } from "next/navigation";
import styles from "./trip-selector.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function TripSelector() {
  const pathname = usePathname();
  const aurillac = pathname.includes("/aurillac");

  return (
    <nav className={styles.selector} aria-label="Seleccionar viaje">
      <span className={styles.brand}>BIDAIAK · 2026</span>
      <div>
        <a className={!aurillac ? styles.active : ""} href={basePath + "/"} aria-current={!aurillac ? "page" : undefined}>
          PORTUGAL
          <small>1–13 AGO</small>
        </a>
        <a className={aurillac ? styles.activeAurillac : ""} href={basePath + "/aurillac/"} aria-current={aurillac ? "page" : undefined}>
          AURILLAC
          <small>15/16–27 AGO</small>
        </a>
      </div>
    </nav>
  );
}
