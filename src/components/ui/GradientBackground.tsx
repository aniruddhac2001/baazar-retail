/** Soft full-screen gradient used across home, form, login, dashboard */
export function GradientBackground() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #eef4fb 0%, #f5f7fa 35%, #f0f4f8 55%, #f8f3ee 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed -top-32 -right-32 -z-10 w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full opacity-40 blur-3xl"
        style={{ background: "#8eb8e8" }}
      />
      <div
        className="pointer-events-none fixed -bottom-32 -left-32 -z-10 w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full opacity-30 blur-3xl"
        style={{ background: "#f0b890" }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.7) 0%, transparent 70%)",
        }}
      />
    </>
  );
}

export default GradientBackground;
