import { useEffect, useRef, useState } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { Asset } from "molstar/lib/mol-util/assets";
import { ColorNames } from "molstar/lib/mol-util/color/names";
import "./styles/molstar.scss";

type Props = {
  /** Entweder pdbId ODER direkte Datei-URL angeben */
  pdbId?: string;
  fileUrl?: string;
  /** Höhe des Viewers (z. B. "70vh", 600, "600px") */
  height?: number | string;
  /** Breite des Viewers (z. B. "100%", "90vw", 1200) */
  width?: number | string;
};

export default function MolstarViewer({
  pdbId,
  fileUrl,
  height = "70vh",
  width = "100%",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resizeObs = useRef<ResizeObserver | null>(null);

  // URL-Auflösung (Backend bevorzugt, sonst RCSB)
  const resolveUrl = async (): Promise<string> => {
    if (fileUrl) return fileUrl;
    if (pdbId) {
      const backend = `http://localhost:8080/api/structures/${pdbId}/file`;
      try {
        const head = await fetch(backend, { method: "HEAD" });
        if (head.ok) return backend;
      } catch {
        /* Fallback unten */
      }
      return `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`;
    }
    throw new Error("Weder pdbId noch fileUrl übergeben.");
  };

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const plugin = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec: DefaultPluginUISpec(),
        });
        if (disposed) {
          plugin.dispose();
          return;
        }
        pluginRef.current = plugin;

        // dunkler Hintergrund für besseren Kontrast
        plugin.canvas3d?.setProps({
          renderer: { backgroundColor: ColorNames.black },
        });

        const finalUrl = await resolveUrl();

        // Datei laden & darstellen
        const data = await plugin.builders.data.download(
          { url: Asset.Url(finalUrl) },
          { state: { isGhost: true } }
        );
        const traj = await plugin.builders.structure.parseTrajectory(
          data,
          "mmcif"
        );
        await plugin.builders.structure.hierarchy.applyPreset(traj, "default");

        // Kamera passend setzen & zeichnen
        await plugin.managers.camera.reset();
        await plugin.canvas3d?.requestDraw(true);

        // Resize-Handling: bei Größenänderung neu zeichnen
        if (containerRef.current) {
          resizeObs.current?.disconnect();
          resizeObs.current = new ResizeObserver(() => {
            plugin.canvas3d?.requestDraw(true);
          });
          resizeObs.current.observe(containerRef.current);
        }

        setLoading(false);
      } catch (e: any) {
        console.error("Mol* init error:", e);
        setError(e?.message ?? "Unbekannter Fehler beim Initialisieren.");
        setLoading(false);
      }
    };

    init();

    return () => {
      resizeObs.current?.disconnect();
      resizeObs.current = null;
      pluginRef.current?.dispose();
      pluginRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdbId, fileUrl]);

  // UI-Handler
  const toggleBackground = () => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    const nextDark = !darkBg;
    setDarkBg(nextDark);
    plugin.canvas3d?.setProps({
      renderer: { backgroundColor: nextDark ? ColorNames.black : ColorNames.white },
    });
    plugin.canvas3d?.requestDraw(true);
  };

  const autoView = async () => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    await plugin.managers.camera.reset();
    await plugin.canvas3d?.requestDraw(true);
  };

  // Höhe/Breite normalisieren (number -> px)
  const normHeight = typeof height === "number" ? `${height}px` : height;
  const normWidth = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      style={{
        position: "relative",
        width: normWidth,
        height: normHeight,
        margin: "16px auto",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: darkBg ? "#000" : "#fff",
          border: "1px solid #333",
          borderRadius: 12,
          overflow: "hidden",
        }}
      />

      {/* Overlay: Lade-/Fehlerstatus */}
      {(loading || error) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.25)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {loading ? "Lade 3D-Ansicht…" : `Fehler: ${error}`}
        </div>
      )}

      {/* Kleine Controls oben rechts */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={toggleBackground}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          title="Hintergrund umschalten"
        >
          {darkBg ? "Heller Hintergrund" : "Dunkler Hintergrund"}
        </button>
        <button
          onClick={autoView}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          title="Ansicht zentrieren"
        >
          Auto-View
        </button>
      </div>
    </div>
  );
}
