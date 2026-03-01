import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePattern } from "@/context/PatternContext";
import { GARMENT_TEMPLATES, TEMPLATE_NAMES } from "@/data/garment-templates";
import { getTemplate } from "@/lib/api";

export default function UploadStep() {
  const navigate = useNavigate();
  const {
    uploadedImage,
    setUploadedImage,
    selectedTemplate,
    setGarmentDescription,
    setStep,
  } = usePattern();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Resize to max 1540x1540 to keep API payloads reasonable
      const img = new Image();
      img.onload = () => {
        const MAX = 1540;
        if (img.width <= MAX && img.height <= MAX) {
          setUploadedImage(dataUrl);
          return;
        }
        const scale = Math.min(MAX / img.width, MAX / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setUploadedImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setFileName("");
  };

  const handleSelectTemplate = (key: string) => {
    const desc = getTemplate(key);
    setGarmentDescription(desc, key);
  };

  const handleAnalyze = () => {
    if (!uploadedImage) return;
    setStep("analyze");
    navigate("/create/analyze");
  };

  const handleQuickStart = () => {
    if (!selectedTemplate) return;
    setStep("measure");
    navigate("/create/measure");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Photo</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a garment photo for AI analysis, or pick a quick-start
          template.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Upload Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo Upload</CardTitle>
              <CardDescription>
                For best results, use a clear photo of the garment laid flat or
                on a mannequin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedImage ? (
                <div
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <svg
                      className="h-8 w-8 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-1">
                    Drag and drop your photo here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileInput}
                      />
                    </label>
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP -- Max 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    <img
                      src={uploadedImage}
                      alt="Uploaded garment"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{fileName}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Ready for analysis
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearImage}>
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Start Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quick Start Templates
              </CardTitle>
              <CardDescription>
                Skip photo analysis and start from a template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(GARMENT_TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectTemplate(key)}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                      selectedTemplate === key
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {TEMPLATE_NAMES[key]}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {tmpl.summary}
                    </span>
                    {selectedTemplate === key && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines + CTA */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photo Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Clear, well-lit photo of the garment",
                "Front-facing view preferred",
                "Lay flat or on a mannequin",
                "Include full garment in frame",
                "Avoid heavy wrinkles or folds",
                "Plain background helps accuracy",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {uploadedImage ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleAnalyze}
              >
                Analyze with AI
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            ) : selectedTemplate ? (
              <Button className="w-full" size="lg" onClick={handleQuickStart}>
                Continue with {TEMPLATE_NAMES[selectedTemplate]}
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            ) : (
              <Button className="w-full" size="lg" disabled>
                Upload a photo or select a template
              </Button>
            )}
            {uploadedImage && selectedTemplate && (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                asChild
              >
                <Link to="/create/measure">
                  Skip analysis, use {TEMPLATE_NAMES[selectedTemplate]}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
