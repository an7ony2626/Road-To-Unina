// shared/animated-background/animated-background.component.ts
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, viewChild } from '@angular/core';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 48;
const LINK_DISTANCE = 140;
const NODE_SPEED = 0.15;
const NODE_COLOR = 'rgba(27, 26, 23, 0.35)'; // var(--ink), hardcoded: canvas 2D
// context can't read CSS custom properties directly without extra work,
// and this token never changes at runtime (no theme toggle in the app).
const LINK_COLOR = 'rgba(27, 26, 23, 0.12)';

// A lightweight "linked pages" background: nodes drift slowly and draw a
// line to any neighbor within LINK_DISTANCE — same visual idea as a
// particle-network library, zero dependencies, full control over what
// actually runs on screen.
@Component({
  selector: 'app-animated-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './animated-background.component.scss',
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
})
export class AnimatedBackgroundComponent implements OnInit, OnDestroy {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx!: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private animationFrameId = 0;
  private readonly resizeHandler = (): void => this.resize();

  ngOnInit(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.resize();
    this.nodes = Array.from({ length: NODE_COUNT }, () => this.createNode(canvas));

    window.addEventListener('resize', this.resizeHandler);
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeHandler);
  }

  private createNode(canvas: HTMLCanvasElement): Node {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * NODE_SPEED,
      vy: (Math.random() - 0.5) * NODE_SPEED,
    };
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private readonly animate = (): void => {
    const canvas = this.canvasRef().nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off the edges instead of wrapping, so a node never
      // teleports across the screen mid-frame.
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = NODE_COLOR;
      this.ctx.fill();
    }

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < LINK_DISTANCE) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
          this.ctx.strokeStyle = LINK_COLOR;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}