export default function vhCheck() {
  const onWindowChange = () => {
    window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    });
  };

  // listen for window resizing
  window.addEventListener('resize', onWindowChange);

  // listen for orientation change
  // - this can't be configured
  // - because it's convenient and not a real performance bottleneck
  window.addEventListener('orientationchange', onWindowChange);

  // listen to touch move for scrolling
  // – disabled by default
  // - listening to scrolling can be expansive…
  window.addEventListener('touchmove', onWindowChange);
}
