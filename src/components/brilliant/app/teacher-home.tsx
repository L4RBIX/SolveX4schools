"use client";

import { useState } from "react";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { TeacherClassroom } from "./teacher-classroom";

/**
 * A teacher's classes, and the one they are looking at.
 *
 * The list comes from `class_teachers` on the server. There is no class picker
 * that could be pointed somewhere else: a class this teacher does not teach is
 * not in the array, and the API behind the panel answers 404 for it anyway.
 */
export function TeacherHome({
  teacherName,
  classes,
}: {
  teacherName: string;
  classes: { schoolId: string; classId: string; name: string }[];
}) {
  const { locale } = useLocale();
  const loc = locale as Locale;
  const [selected, setSelected] = useState(classes[0]?.classId ?? null);

  if (classes.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center bg-b-bg px-6 font-b-sans text-b-fg">
        <div className="max-w-[420px] rounded-[16px] border-2 border-b-lock-edge bg-b-lock-fill px-6 py-8 text-center">
          <h1 className="mb-2 text-[22px] font-bold">{teacherName}</h1>
          <p className="text-[16px] leading-6 text-b-fg/70">{t(L.teacherNoClasses, loc)}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-sx-page px-6 py-8 font-b-sans text-b-fg">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-[26px] leading-[34px] font-bold">{teacherName}</h1>
          {classes.length > 1 ? (
            <div role="group" className="flex gap-2">
              {classes.map((c) => (
                <button
                  key={c.classId}
                  type="button"
                  aria-pressed={selected === c.classId}
                  onClick={() => setSelected(c.classId)}
                  className={
                    "h-10 rounded-[10px] border-2 px-4 text-[15px] " +
                    (selected === c.classId
                      ? "border-b-sched-edge-on bg-b-sched-fill-on"
                      : "border-b-sched-edge bg-b-sched-fill")
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </header>

        {selected ? <TeacherClassroom classId={selected} /> : null}
      </div>
    </main>
  );
}
