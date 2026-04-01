"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";

export default function BackHandler() {
  const router = useRouter();

  useEffect(() => {
    let listener: any;

    const setup = async () => {
      listener = await App.addListener("backButton", () => {
        if (window.location.pathname === "/") {
          App.exitApp();
        } else {
          router.back();
        }
      });
    };

    setup();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  return null;
}