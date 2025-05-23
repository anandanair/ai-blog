import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./LoadingAnimation.module.css";

const LoadingAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const handRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    // Create master timeline
    const masterTl = gsap.timeline();

    // Initial reveal animation
    if (containerRef.current) {
      masterTl.from(containerRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
      });
    }

    // Clock icon animation
    const clockTl = gsap.timeline({ repeat: -1 });

    // Continuous rotation of the entire icon
    if (iconRef.current) {
      clockTl.to(iconRef.current, {
        rotation: 360,
        duration: 20,
        ease: "linear",
        repeat: -1,
      });
    }

    // Hand ticking animation
    if (handRef.current) {
      gsap.to(handRef.current, {
        rotation: 360,
        transformOrigin: "left center",
        duration: 2,
        ease: "steps(12)",
        repeat: -1,
      });
    }

    // Circle pulse animation
    if (circleRef.current) {
      gsap.to(circleRef.current, {
        scale: 1.05,
        strokeWidth: 5,
        duration: 1,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    // Text and dots animation
    const textTl = gsap.timeline({ repeat: -1 });

    // Animate the loading text with a slight bounce
    if (textRef.current) {
      textTl.to(textRef.current, {
        y: -5,
        duration: 0.5,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }

    // Animate the loading dots with a wave effect
    if (dotsRef.current && dotsRef.current.children) {
      gsap.to(dotsRef.current.children, {
        y: -8,
        opacity: 1,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    // Progress bar animation
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: "100%",
        duration: 8,
        ease: "power1.inOut",
        repeat: -1,
      });
    }

    // Particles animation
    particlesRef.current.forEach((particle) => {
      if (!particle) return;

      // Random starting positions
      gsap.set(particle, {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        scale: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
      });

      // Animate each particle
      gsap.to(particle, {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
        duration: Math.random() * 5 + 5,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    return () => {
      // Clean up all animations
      gsap.killTweensOf(
        [
          containerRef.current,
          iconRef.current,
          handRef.current,
          circleRef.current,
          textRef.current,
          dotsRef.current?.children,
          progressBarRef.current,
          ...particlesRef.current.filter(Boolean),
        ].filter(Boolean)
      );
      masterTl.kill();
      clockTl.kill();
      textTl.kill();
    };
  }, []);

  // Function to create array of specific length for particles
  const createParticleArray = (length: number) => {
    return Array.from({ length }, (_, i) => (
      <div
        key={i}
        className={styles.particle}
        ref={(el: HTMLDivElement | null): void => {
          particlesRef.current[i] = el;
        }}
      />
    ));
  };

  return (
    <div className={styles.loaderContainer} ref={containerRef}>
      <div className={styles.particlesContainer}>{createParticleArray(12)}</div>

      <div className={styles.loaderContent}>
        <div className={styles.loaderIcon} ref={iconRef}>
          <svg width="80" height="80" viewBox="0 0 50 50">
            <circle
              ref={circleRef}
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#3498db"
              strokeWidth="3"
              className={styles.clockFace}
            />
            <path
              ref={handRef}
              d="M25 25 L25 10"
              stroke="#3498db"
              strokeWidth="3"
              strokeLinecap="round"
              className={styles.clockHand}
            />
            <circle cx="25" cy="25" r="3" fill="#3498db" />
          </svg>
        </div>

        <div className={styles.loaderText}>
          <span ref={textRef}>Loading</span>
          <span className={styles.dots} ref={dotsRef}>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

        <div className={styles.loaderSubtext}>
          Preparing the latest in autonomous technology
        </div>

        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} ref={progressBarRef}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
