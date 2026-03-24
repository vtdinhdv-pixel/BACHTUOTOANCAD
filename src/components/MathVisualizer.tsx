import { useEffect, useRef } from "react";
import p5 from "p5";

interface MathVisualizerProps {
  topic: string;
  data?: any;
}

export default function MathVisualizer({ topic, data }: MathVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(300, 200);
        p.textAlign(p.CENTER, p.CENTER);
      };

      p.draw = () => {
        p.background(255);
        
        if (topic.toLowerCase().includes("phân số")) {
          drawFractions(p);
        } else if (topic.toLowerCase().includes("số nguyên")) {
          drawNumberLine(p);
        } else {
          p.fill(200);
          p.noStroke();
          p.ellipse(p.width/2, p.height/2, 100, 100);
          p.fill(100);
          p.text("Chưa có hình minh họa cho chủ đề này", p.width/2, p.height/2);
        }
      };

      const drawFractions = (p: p5) => {
        const parts = data?.parts || 4;
        const shaded = data?.shaded || 1;
        const angle = p.TWO_PI / parts;
        
        p.translate(p.width/2, p.height/2);
        p.stroke(0);
        
        for (let i = 0; i < parts; i++) {
          if (i < shaded) {
            p.fill(116, 185, 255); // Blue
          } else {
            p.fill(255);
          }
          p.arc(0, 0, 150, 150, i * angle, (i + 1) * angle, p.PIE);
        }

        p.fill(0);
        p.noStroke();
        p.textSize(16);
        p.text(`${shaded}/${parts}`, 0, 90);
      };

      const drawNumberLine = (p: p5) => {
        const current = data?.value || 0;
        p.translate(0, p.height/2);
        p.stroke(150);
        p.line(20, 0, p.width - 20, 0);
        
        for(let i = -5; i <= 5; i++) {
          const x = p.map(i, -5, 5, 40, p.width - 40);
          p.line(x, -5, x, 5);
          p.fill(100);
          p.noStroke();
          p.textSize(10);
          p.text(i.toString(), x, 15);
        }

        // Current point
        const px = p.map(current, -5, 5, 40, p.width - 40);
        p.fill(255, 118, 117); // Red
        p.ellipse(px, 0, 10, 10);
        p.textSize(12);
        p.text(`Giá trị: ${current}`, px, -20);
      };
    };

    const p5Instance = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.remove();
    };
  }, [topic, data]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden flex flex-col items-center">
      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Trực quan hóa: {topic}</h4>
      <div ref={containerRef} />
      <p className="text-[10px] text-gray-400 mt-2 italic">* Em có thể tương tác với hình này (đang phát triển)</p>
    </div>
  );
}
