import { motion } from 'framer-motion';
import LogoMark from './LogoMark';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-teal-600">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <LogoMark className="h-20 w-20 rounded-2xl shadow-lg" />
      </motion.div>
      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-white text-2xl font-bold tracking-tight"
      >
        HisabKitab
      </motion.h1>
      <p className="text-teal-100 text-sm mt-1">Trip ka hisaab, ekdum saaf</p>
    </div>
  );
}
