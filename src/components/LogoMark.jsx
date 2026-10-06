import logoImage from '../../IMAGE/logo 2.png';

export default function LogoMark({ className = '', alt = 'HisabKitab logo' }) {
  return (
    <img
      src={logoImage}
      alt={alt}
      className={`block object-cover ${className}`}
      loading="eager"
    />
  );
}
