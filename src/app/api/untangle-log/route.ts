import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. If Supabase client is not available or database is not configured, return premium mock data
    if (!supabase) {
      console.warn("Supabase is not configured. Returning fallback mock data.");
      return NextResponse.json(getMockData());
    }

    // 2. Fetch raw logs from the database
    const { data: rawLogs, error: dbError } = await supabase
      .from("usage_logs")
      .select("input_type, tone_mode, risk_level, confidence_level, created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Database query failed, returning fallback mock data:", dbError.message);
      return NextResponse.json(getMockData());
    }

    // 3. Process the logs
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allTimeStats = calculateStats(rawLogs || []);
    const thisWeekLogs = (rawLogs || []).filter((log) => {
      if (!log.created_at) return false;
      const logDate = new Date(log.created_at);
      return logDate >= sevenDaysAgo;
    });
    const thisWeekStats = calculateStats(thisWeekLogs);

    // If the database has absolutely 0 logs, provide the mock data to keep the editorial clean and engaging
    if (allTimeStats.total === 0) {
      return NextResponse.json(getMockData());
    }

    return NextResponse.json({
      allTime: allTimeStats,
      thisWeek: thisWeekStats,
      isRealData: true,
    });
  } catch (err: unknown) {
    console.error("Unhandled error in /api/untangle-log:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching statistics." },
      { status: 500 }
    );
  }
}

interface LogEntry {
  input_type: string;
  tone_mode: string;
  risk_level: string;
  confidence_level: string;
  created_at?: string;
}

interface StatBreakdown {
  total: number;
  risk: {
    low: { count: number; pct: number };
    medium: { count: number; pct: number };
    high: { count: number; pct: number };
  };
  tone: {
    simple: { count: number; pct: number };
    student: { count: number; pct: number };
    teacher: { count: number; pct: number };
    elderly: { count: number; pct: number };
  };
  inputType: {
    text: { count: number; pct: number };
    pdf: { count: number; pct: number };
    image: { count: number; pct: number };
  };
}

function calculateStats(logs: LogEntry[]): StatBreakdown {
  const total = logs.length;

  const risk = { low: 0, medium: 0, high: 0 };
  const tone = { simple: 0, student: 0, teacher: 0, elderly: 0 };
  const inputType = { text: 0, pdf: 0, image: 0 };

  logs.forEach((log) => {
    // Risk Levels
    const r = (log.risk_level || "low").toLowerCase();
    if (r === "high") risk.high++;
    else if (r === "medium") risk.medium++;
    else risk.low++;

    // Tone Modes
    const t = (log.tone_mode || "simple").toLowerCase();
    if (t === "student") tone.student++;
    else if (t === "teacher") tone.teacher++;
    else if (t === "elderly" || t === "elderly-friendly") tone.elderly++;
    else tone.simple++;

    // Input Types
    const i = (log.input_type || "text").toLowerCase();
    if (i === "pdf") inputType.pdf++;
    else if (i === "image") inputType.image++;
    else inputType.text++;
  });

  const getPct = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return {
    total,
    risk: {
      low: { count: risk.low, pct: getPct(risk.low) },
      medium: { count: risk.medium, pct: getPct(risk.medium) },
      high: { count: risk.high, pct: getPct(risk.high) },
    },
    tone: {
      simple: { count: tone.simple, pct: getPct(tone.simple) },
      student: { count: tone.student, pct: getPct(tone.student) },
      teacher: { count: tone.teacher, pct: getPct(tone.teacher) },
      elderly: { count: tone.elderly, pct: getPct(tone.elderly) },
    },
    inputType: {
      text: { count: inputType.text, pct: getPct(inputType.text) },
      pdf: { count: inputType.pdf, pct: getPct(inputType.pdf) },
      image: { count: inputType.image, pct: getPct(inputType.image) },
    },
  };
}

function getMockData() {
  return {
    allTime: {
      total: 4892,
      risk: {
        low: { count: 3912, pct: 80 },
        medium: { count: 784, pct: 16 },
        high: { count: 196, pct: 4 },
      },
      tone: {
        simple: { count: 1957, pct: 40 },
        student: { count: 978, pct: 20 },
        teacher: { count: 734, pct: 15 },
        elderly: { count: 1223, pct: 25 },
      },
      inputType: {
        text: { count: 2690, pct: 55 },
        pdf: { count: 1468, pct: 30 },
        image: { count: 734, pct: 15 },
      },
    },
    thisWeek: {
      total: 312,
      risk: {
        low: { count: 243, pct: 78 },
        medium: { count: 53, pct: 17 },
        high: { count: 16, pct: 5 },
      },
      tone: {
        simple: { count: 121, pct: 39 },
        student: { count: 68, pct: 22 },
        teacher: { count: 44, pct: 14 },
        elderly: { count: 79, pct: 25 },
      },
      inputType: {
        text: { count: 175, pct: 56 },
        pdf: { count: 91, pct: 29 },
        image: { count: 46, pct: 15 },
      },
    },
    isRealData: false,
  };
}
