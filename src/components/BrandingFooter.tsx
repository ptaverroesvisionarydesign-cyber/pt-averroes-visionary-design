/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export default function BrandingFooter() {
  return (
    <motion.a
      href="https://www.averroes-visionarydesign.com"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md border border-purple-100 px-4 py-2 rounded-full shadow-lg group transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.8, y: 0 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
    >
      <span className="w-2 h-2 bg-primary rounded-full animate-pulse group-hover:shadow-[0_0_8px_#9333EA]"></span>
      <span className="text-[10px] font-bold text-purple-900 opacity-75 uppercase tracking-tighter">Ⓡ averroes-visionarydesign.com</span>
    </motion.a>
  );
}
