/**
 * Maps icon name strings (stored in DB) to MUI React components.
 * Used by both the category display in Home and the icon picker in stock/Categories.
 */
import React from 'react';
import ElectricalServices  from '@mui/icons-material/ElectricalServices';
import Cable               from '@mui/icons-material/Cable';
import Power               from '@mui/icons-material/Power';
import Dashboard           from '@mui/icons-material/Dashboard';
import Lightbulb           from '@mui/icons-material/Lightbulb';
import ElectricMeter       from '@mui/icons-material/ElectricMeter';
import SettingsInputComponent from '@mui/icons-material/SettingsInputComponent';
import WbSunny             from '@mui/icons-material/WbSunny';
import Router              from '@mui/icons-material/Router';
import Handyman            from '@mui/icons-material/Handyman';
import Shield              from '@mui/icons-material/Shield';
import Category            from '@mui/icons-material/Category';
import ElectricBolt        from '@mui/icons-material/ElectricBolt';
import Build               from '@mui/icons-material/Build';
import HomeWork            from '@mui/icons-material/HomeWork';
import Settings            from '@mui/icons-material/Settings';
import Outlet              from '@mui/icons-material/Outlet';
import BatteryChargingFull from '@mui/icons-material/BatteryChargingFull';
import Engineering         from '@mui/icons-material/Engineering';
import FlashOn             from '@mui/icons-material/FlashOn';
import GridView            from '@mui/icons-material/GridView';
import OfflineBolt         from '@mui/icons-material/OfflineBolt';
// Extended icon set
import SolarPower          from '@mui/icons-material/SolarPower';
import Thermostat          from '@mui/icons-material/Thermostat';
import AcUnit              from '@mui/icons-material/AcUnit';
import WaterDrop           from '@mui/icons-material/WaterDrop';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Plumbing            from '@mui/icons-material/Plumbing';
import Construction        from '@mui/icons-material/Construction';
import Hardware            from '@mui/icons-material/Hardware';
import Carpenter           from '@mui/icons-material/Carpenter';
import Inventory           from '@mui/icons-material/Inventory';
import Inventory2          from '@mui/icons-material/Inventory2';
import FactoryIcon         from '@mui/icons-material/Factory';
import PrecisionManufacturing from '@mui/icons-material/PrecisionManufacturing';
import SensorsIcon         from '@mui/icons-material/Sensors';
import DeviceHub           from '@mui/icons-material/DeviceHub';
import Memory              from '@mui/icons-material/Memory';
import Computer            from '@mui/icons-material/Computer';
import PhoneAndroid        from '@mui/icons-material/PhoneAndroid';
import CameraAlt           from '@mui/icons-material/CameraAlt';
import Headphones          from '@mui/icons-material/Headphones';
import Tv                  from '@mui/icons-material/Tv';
import Kitchen             from '@mui/icons-material/Kitchen';
import LocalLaundryService from '@mui/icons-material/LocalLaundryService';
import Microwave           from '@mui/icons-material/Microwave';
import WorkspacePremium    from '@mui/icons-material/WorkspacePremium';
import Bolt                from '@mui/icons-material/Bolt';
import Lan                 from '@mui/icons-material/Lan';
import Security            from '@mui/icons-material/Security';
import Lock                from '@mui/icons-material/Lock';
import AlarmOn             from '@mui/icons-material/AlarmOn';
import VpnKey              from '@mui/icons-material/VpnKey';
import Grass               from '@mui/icons-material/Grass';
import Spa                 from '@mui/icons-material/Spa';
import LocalFlorist        from '@mui/icons-material/LocalFlorist';

export const ICON_REGISTRY: Record<string, React.ElementType> = {
  ElectricalServices,
  Cable,
  Power,
  Dashboard,
  Lightbulb,
  ElectricMeter,
  SettingsInputComponent,
  WbSunny,
  Router,
  Handyman,
  Shield,
  Category,
  ElectricBolt,
  Build,
  HomeWork,
  Settings,
  Outlet,
  BatteryChargingFull,
  Engineering,
  FlashOn,
  GridView,
  OfflineBolt,
  SolarPower,
  Thermostat,
  AcUnit,
  WaterDrop,
  LocalFireDepartment,
  Plumbing,
  Construction,
  Hardware,
  Carpenter,
  Inventory,
  Inventory2,
  Factory: FactoryIcon,
  PrecisionManufacturing,
  Sensors: SensorsIcon,
  DeviceHub,
  Memory,
  Computer,
  PhoneAndroid,
  CameraAlt,
  Headphones,
  Tv,
  Kitchen,
  LocalLaundryService,
  Microwave,
  WorkspacePremium,
  Bolt,
  Lan,
  Security,
  Lock,
  AlarmOn,
  VpnKey,
  Grass,
  Spa,
  LocalFlorist,
};

/** All icons available in the picker with display labels */
export const ICON_PALETTE: { name: string; label: string }[] = [
  { name: 'ElectricalServices',    label: 'Disjoncteur' },
  { name: 'Cable',                 label: 'Câble' },
  { name: 'Power',                 label: 'Prise' },
  { name: 'Dashboard',             label: 'Tableau' },
  { name: 'Lightbulb',             label: 'Éclairage' },
  { name: 'ElectricMeter',         label: 'Compteur' },
  { name: 'SettingsInputComponent',label: 'Moteur' },
  { name: 'WbSunny',               label: 'Solaire' },
  { name: 'SolarPower',            label: 'Panneaux solaires' },
  { name: 'Router',                label: 'Domotique' },
  { name: 'Handyman',              label: 'Outillage' },
  { name: 'Shield',                label: 'Sécurité' },
  { name: 'ElectricBolt',          label: 'Électricité' },
  { name: 'Build',                 label: 'Outils' },
  { name: 'HomeWork',              label: 'Maison' },
  { name: 'Settings',              label: 'Paramètres' },
  { name: 'Outlet',                label: 'Prise murale' },
  { name: 'BatteryChargingFull',   label: 'Batterie' },
  { name: 'Engineering',           label: 'Ingénierie' },
  { name: 'FlashOn',               label: 'Flash' },
  { name: 'OfflineBolt',           label: 'Hors-ligne' },
  { name: 'GridView',              label: 'Grille' },
  { name: 'Category',              label: 'Catégorie' },
  { name: 'Thermostat',            label: 'Thermostat' },
  { name: 'AcUnit',                label: 'Climatisation' },
  { name: 'WaterDrop',             label: 'Eau / Plomberie' },
  { name: 'LocalFireDepartment',   label: 'Incendie' },
  { name: 'Plumbing',              label: 'Plomberie' },
  { name: 'Construction',          label: 'Chantier' },
  { name: 'Hardware',              label: 'Quincaillerie' },
  { name: 'Carpenter',             label: 'Menuiserie' },
  { name: 'Inventory',             label: 'Stock' },
  { name: 'Inventory2',            label: 'Boîte stock' },
  { name: 'Factory',               label: 'Usine' },
  { name: 'PrecisionManufacturing',label: 'Fabrication' },
  { name: 'Sensors',               label: 'Capteurs' },
  { name: 'DeviceHub',             label: 'Hub' },
  { name: 'Memory',                label: 'Électronique' },
  { name: 'Computer',              label: 'Informatique' },
  { name: 'PhoneAndroid',          label: 'Mobile' },
  { name: 'CameraAlt',             label: 'Caméra' },
  { name: 'Headphones',            label: 'Audio' },
  { name: 'Tv',                    label: 'TV / Écran' },
  { name: 'Kitchen',               label: 'Cuisine' },
  { name: 'LocalLaundryService',   label: 'Laverie' },
  { name: 'Microwave',             label: 'Électroménager' },
  { name: 'WorkspacePremium',      label: 'Premium' },
  { name: 'Bolt',                  label: 'Haute tension' },
  { name: 'Lan',                   label: 'Réseau' },
  { name: 'Security',              label: 'Alarme' },
  { name: 'Lock',                  label: 'Serrure' },
  { name: 'AlarmOn',               label: 'Minuterie' },
  { name: 'VpnKey',                label: 'Clé' },
  { name: 'Grass',                 label: 'Jardin' },
  { name: 'Spa',                   label: 'Bien-être' },
  { name: 'LocalFlorist',          label: 'Fleurs' },
];

/** Resolve an icon name string to its component, falling back to Category */
export function resolveIcon(name?: string | null): React.ElementType {
  return (name && ICON_REGISTRY[name]) ? ICON_REGISTRY[name] : Category;
}
