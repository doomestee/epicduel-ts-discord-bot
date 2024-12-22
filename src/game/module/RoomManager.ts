import { findIndex, map } from "../../util/Misc.js";
import SwarmResources from "../../util/game/SwarmResources.js";
import Constants from "../Constants.js";
import type User from "../User.js";
import RoomManagerRecord from "../record/RoomManagerRecord.js";
import { MapItemRule, MapItemRuleSet } from "../record/map/MapItem.js";
import MapObjectGroup from "../record/map/MapObject.js";
import { MSR_DoesNotOwnItemAndMissionIncomplete, MSR_HasAlignmentAndAnyMissionCompleteInSet, MSR_MissionComplete, MSR_MissionNotComplete, MSR_NoAlignment, MSR_NoAlignmentOrNoMissionCompleteInSet, MSR_OwnItemOrMissionComplete, MapStateRuleSet } from "../record/map/MapStateRule.js";
import type Room from "../sfs/data/Room.js";

export default class RoomManager {
    //#region massive absurdity of declaration
    public static readonly REGION_HOME = -1;
      
    public static readonly REGION_FACTION_HQ = -2;
    
    public static readonly REGION_FORTUNE_CITY = "Fortune City";
    
    public static readonly REGION_FORTUNE_CITY_ID = 1;
    
    public static readonly REGION_CENTRAL_STATION_ID = 2;
    
    public static readonly REGION_CENTRAL_STATION = "Central Station";
    
    public static readonly REGION_WEST_NAVAL_YARD_ID = 3;
    
    public static readonly REGION_WEST_NAVAL_YARD = "West Naval Yard";
    
    public static readonly REGION_OVERLORD_FACILITY_ID = 4;
    
    public static readonly REGION_OVERLORD_FACILITY = "Overlord Facility";
    
    public static readonly REGION_BIOLOGICAL_PRESERVE_ID = 5;
    
    public static readonly REGION_BIOLOGICAL_PRESERVE = "Biological Preserve";
    
    public static readonly REGION_BARRENS_OUTPOST_ID = 6;
    
    public static readonly REGION_BARRENS_OUTPOST = "Barrens Outpost";
    
    public static readonly REGION_WASTELAND_ID = 7;
    
    public static readonly REGION_WASTELAND = "Wasteland";
    
    public static readonly REGION_FRYSTELAND_ID = 8;
    
    public static readonly REGION_FRYSTELAND = "Frysteland";
    
    public static readonly REGION_INFERNAL_MINES_ID = 9;
    
    public static readonly REGION_INFERNAL_MINES = "Infernal Mines";
    
    public static readonly REGION_DREAD_PLAINS_ID = 10;
    
    public static readonly REGION_DREAD_PLAINS = "Dread Plains";
    
    public static readonly REGION_FELDSPAR_FLATS_ID = 11;
    
    public static readonly REGION_FELDSPAR_FLATS = "Feldspar Flats";
    
    public static readonly REGION_AFTERLIFE_ID = 12;
    
    public static readonly REGION_AFTERLIFE = "Afterlife";
    
    public static _regionIdList = [this.REGION_FORTUNE_CITY_ID,this.REGION_CENTRAL_STATION_ID,this.REGION_WEST_NAVAL_YARD_ID,this.REGION_OVERLORD_FACILITY_ID,this.REGION_BIOLOGICAL_PRESERVE_ID,this.REGION_BARRENS_OUTPOST_ID,this.REGION_WASTELAND_ID,this.REGION_FRYSTELAND_ID,this.REGION_INFERNAL_MINES_ID,this.REGION_DREAD_PLAINS_ID,this.REGION_FELDSPAR_FLATS_ID,this.REGION_AFTERLIFE_ID];
    
    private static readonly BG_CLASSIC = "General_Battle_Background_1_1";
    
    private static readonly BG_CLASSIC2 = "General_Battle_Background_2_1";
    
    private static readonly BG_CLASSIC3 = "General_Battle_Background_3_1";
    
    private static readonly BG_CLASSIC4 = "General_Battle_Background_4_1";
    
    private static readonly BG_CLASSIC5 = "General_Battle_Background_5_1";
    
    private static readonly BG_CLASSIC6 = "General_Battle_Background_6_1";
    
    private static readonly BG_CLASSIC7 = "General_Battle_Background_7_1";
    
    private static readonly BG_CLASSIC8 = "General_Battle_Background_8_1";
    
    private static readonly BG_BARRENS_OUTPOST_GENERAL = "BarrensOutpost_General_1";
    
    private static readonly BG_BARRENS_OUTPOST_PROPAGANDA_TOWER = "BarrensOutpost_PropagandaTower_2";
    
    private static readonly BG_BARRENS_OUTPOST_BAZAAR_ENTRANCE = "BarrensOutpost_BazaarEntrance_2";
    
    private static readonly BG_BARRENS_OUTPOST_SHIELD_GENERATOR = "BarrensOutpost_ShieldGenerator_1";
    
    private static readonly BG_BARRENS_OUTPOST_TURRET_ARRAY = "BarrensOutpost_TurretArray_3";
    
    private static readonly BG_BARRENS_OUTPOST_MIRVS_SHOP = "BarrensOutpost_MirvsShop_2";
    
    private static readonly BG_BARRENS_OUTPOST_DRAGONOID_SHIP = "BarrensOutpost_DragonoidShip_1";
    
    private static readonly BG_BIODOME_TURRET = "Biodome_Turret_1";
    
    private static readonly BG_BIODOME_SHIELD_GENERATOR = "Biodome_ShieldGenerator_3";
    
    private static readonly BG_BIODOME_GENERAL = "Biodome_General_1";
    
    private static readonly BG_BIODOME_GENERAL2 = "Biodome_General2_1";
    
    private static readonly BG_BIODOME_AMMO_DEPOT = "Biodome_AmmoDepot_2";
    
    private static readonly BG_BIODOME_ARCHIVES_INTERIOR = "Biodome_ArchivesInterior_2";
    
    private static readonly BG_BIODOME_HOLE = "Biodome_Hole";
    
    private static readonly BG_AFTERLIFE_ADJUDICATORBOSS = "Afterlife_AdjudicatorBoss";
    
    private static readonly BG_CENTRAL_STATION_GENERAL = "CentralStation_General_1";
    
    private static readonly BG_CENTRAL_STATION_TURRET = "CentralStation_Turret_1";
    
    private static readonly BG_CENTRAL_STATION_SHIELD_GENERATOR = "CentralStation_ShieldGenerator_1";
    
    private static readonly BG_CENTRAL_STATION_TOWER = "CentralStation_Tower_2";
    
    private static readonly BG_CENTRAL_STATION_AMMO_DEPOT = "CentralStation_AmmoDepot_2";
    
    private static readonly BG_CENTRAL_STATION_COMMAND_HUB = "CentralStation_CommandHub_2";
    
    private static readonly BG_DREAD_PLAINS_GENERAL = "DreadPlains_General_1";
    
    private static readonly BG_DREAD_PLAINS_AMMO_DEPOT = "DreadPlains_AmmoDepot_2";
    
    private static readonly BG_DREAD_PLAINS_SHIELD_GENERATOR = "DreadPlains_ShieldGenerator_2";
    
    private static readonly BG_DREAD_PLAINS_CONTROL_ARRAY = "DreadPlains_ControlArray_2";
    
    private static readonly BG_DREAD_PLAINS_LEFT_TOWER = "DreadPlains_LeftTower_3";
    
    private static readonly BG_DREAD_PLAINS_RIGHT_TOWER = "DreadPlains_RightTower_3";
    
    private static readonly BG_DREAD_PLAINS_RADAR_ARRAY = "DreadPlains_RadarArray_2";
    
    private static readonly BG_DREAD_PLAINS_MISSILE_TURRET = "DreadPlains_MissileTurret_3";
    
    private static readonly BG_DREAD_PLAINS_LUTHIEL_BOSS = "DreadPlains_LuthielBoss_1";
    
    private static readonly BG_FORTUNE_CITY_BATTLE_ARENA = "FortuneCity_BattleArena_1";
    
    private static readonly BG_FORTUNE_CITY_BATTLE_ARENA_OUTSIDE = "FortuneCity_BattleArenaOutside_2";
    
    private static readonly BG_FORTUNE_CITY_HANKS_BACKALLEY = "FortuneCity_HanksBackalley_1";
    
    private static readonly BG_FORTUNE_CITY_SPIRE_MAIN = "FortuneCity_SpireMain_1";
    
    private static readonly BG_FORTUNE_CITY_MAIN_STREET = "FortuneCity_MainStreet_2";
    
    private static readonly BG_FORTUNE_CITY_OUTER_GATE = "FortuneCity_OuterGate_2";
    
    private static readonly BG_FORTUNE_CITY_SPIRE_TURRET = "FortuneCity_SpireTurret_3";
    
    private static readonly BG_FORTUNE_CITY_OLD_AMMO_DEPOT = "FortuneCity_OldAmmoDepot_2";
    
    private static readonly BG_FORTUNE_CITY_GUARD_OUTPOST = "FortuneCity_GuardOutpost_3";
    
    private static readonly BG_OVERLORD_FACILITY_GENERAL = "OverlordFacility_General_2";
    
    private static readonly BG_OVERLORD_FACILITY_THRONE_ROOM = "OverlordFacility_ThroneRoom_1";
    
    private static readonly BG_OVERLORD_FACILITY_MAIN = "OverlordFacility_Main_2";
    
    private static readonly BG_OVERLORD_FACILITY_OUTSIDE = "OverlordFacility_Outside_4";
    
    private static readonly BG_OVERLORD_FACILITY_BASE = "OverlordFacility_Base_4";
    
    private static readonly BG_OVERLORD_FACILITY_TOWER = "OverlordFacility_Tower_2";
    
    private static readonly BG_WEST_NAVAL_YARD_GENERAL = "WestNavalYard_General_2";
    
    private static readonly BG_WEST_NAVAL_YARD_KRAKEN = "WestNavalYard_Kraken";
    
    private static readonly BG_WEST_NAVAL_YARD_BEYOND_KRAKEN = "WestNavalYard_BeyondKraken_1";
    
    private static readonly BG_WEST_NAVAL_YARD_SHIELD_GENERATOR = "WestNavalYard_ShieldGenerator_1";
    
    private static readonly BG_WEST_NAVAL_YARD_SHACK = "WestNavalYard_Shack_3";
    
    private static readonly BG_WEST_NAVAL_YARD_CANNON = "WestNavalYard_Cannon_3";
    
    private static readonly BG_INFERNAL_MINES_BATTLEGROUND = "InfernalMines_Battleground_1";
    
    private static readonly BG_INFERNAL_MINES_VAULT = "InfernalMines_Vault_1";
    
    private static readonly BG_INFERNAL_MINES_VAULT_BOSS = "InfernalMines_Vault_Boss_1";
    
    private static readonly BG_MINETOWER_SUITE = "Minetower_Suite_1";
    
    private static readonly BG_MINETOWER_SUITE_ENTRANCE = "Minetower_SuiteEntrance_2";
    
    private static readonly BG_MINETOWER_BASE_SHIELD_GENERATOR = "Minetower_BaseShieldGenerator_3";
    
    private static readonly BG_DAGE_AND_DARKON = "Minetower_DageAndDarkon_1";
    
    private static readonly BG_MINES_GENERAL = "Mines_General_1";
    
    private static readonly BG_MINES_MINESTATION_TOWER = "Mines_MinestationTower_2";
    
    private static readonly BG_MINES_REFINERY_ENTRANCE = "Mines_RefineryEntrance_2";
    
    private static readonly BG_MINES_GOD_OF_WAR_CHAMBER = "Mines_GodOfWarChamber_1";
    
    private static readonly BG_FELDSPAR_FLATS_GENERAL = "Feldspar_Flats_General_1";
    
    private static readonly BG_FELDSPAR_FLATS_WALL = "Feldspar_Flats_Wall_1";
    
    private static readonly BG_FELDSPAR_FLATS_EXIT = "Feldspar_Flats_Exit_1";
    
    private static readonly BG_BAR_BACK = "Bar_Back_1";
    
    private static readonly BG_FRYSTELAND_GENERAL = "Frysteland_General_1";
    
    private static readonly BG_FRYSTELAND_THRONE_ROOM = "Frysteland_ThroneRoom_1";
    
    private static readonly BG_FRYSTELAND_TITANS_PEAK = "Frysteland_Titans_Peak_1";
    
    private static readonly BG_AFTERLIFE_GENERAL = "Afterlife_General_1";
    
    private static readonly BG_AFTERLIFE_NIGHTMARE = "Afterlife_Nightmare_1";
    
    private static readonly BG_AFTERLIFE_TMMBOSS = "Afterlife_TMM_Boss_1";
    
    private static readonly BG_TIME_FORTRESS = "Time_Fortress_1";
    
    private static readonly BG_AFTERLIFE_AZRAELBOSS = "Afterlife_AzraelBoss_1";
    
    private static readonly BG_AFTERLIFE_ACATRIELBOSS = "Afterlife_AcatrielBoss_3";
    
    private static readonly BG_WASTELAND_HUSK = "Wasteland_Husk_1";
    
    private static readonly BG_WASTELAND_NIGHTMARE = "Wasteland_Nightmare_1";
    
    private static readonly BG_WASTELAND_AMMO_DEPOT = "Wasteland_AmmoDepot_1";
    
    private static readonly BG_WASTELAND_MISSILE_TURRET = "Wasteland_MissileTurret_1";
    
    private static readonly BG_WASTELAND_ULYSSES_RADAR = "Wasteland_UlyssesRadar_2";
    
    private static readonly BG_WASTELAND_MINETOWER_ENTRANCE_AMMO_DEPOT = "Wasteland_MinetowerEntranceAmmoDepot_2";
    
    private static readonly BG_WASTELAND_SPIDER_BOSS = "Wasteland_SpiderBoss_1";
    
    private static readonly BG_SET_FORTUNE_CITY = [this.BG_FORTUNE_CITY_HANKS_BACKALLEY,this.BG_FORTUNE_CITY_MAIN_STREET,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_CENTRAL_STATION = [this.BG_CENTRAL_STATION_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_WEST_NAVAL_YARD = [this.BG_WEST_NAVAL_YARD_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_OVERLORD_FACILITY = [this.BG_OVERLORD_FACILITY_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_BIODOME = [this.BG_BIODOME_GENERAL,this.BG_BIODOME_GENERAL2,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_BARRENS_OUTPOST = [this.BG_BARRENS_OUTPOST_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_WASTELAND = [this.BG_WASTELAND_AMMO_DEPOT,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_MINES = [this.BG_MINES_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_MINETOWER = [this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_FELDSPAR_FLATS = [this.BG_FELDSPAR_FLATS_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_FRYSTELAND = [this.BG_FRYSTELAND_GENERAL,this.BG_FRYSTELAND_THRONE_ROOM,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_INFERNAL_MINES = [this.BG_INFERNAL_MINES_BATTLEGROUND,this.BG_INFERNAL_MINES_VAULT,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_DREAD_PLAINS = [this.BG_DREAD_PLAINS_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    private static readonly BG_SET_AFTERLIFE = [this.BG_AFTERLIFE_GENERAL,this.BG_CLASSIC,this.BG_CLASSIC2,this.BG_CLASSIC3,this.BG_CLASSIC4,this.BG_CLASSIC5,this.BG_CLASSIC6,this.BG_CLASSIC7,this.BG_CLASSIC8];
    
    public static readonly LOBBY = "Lobby";
    
    public static readonly AFTERLIFE_1 = "Afterlife1";
    
    public static readonly AFTERLIFE_2 = "Afterlife2";
    
    public static readonly AFTERLIFE_3 = "Afterlife3";
    
    public static readonly AFTERLIFE_THRONE = "AfterlifeThrone";
    
    public static readonly AFTERLIFE_PORTAL = "AfterlifePortal";
    
    public static readonly AFTERLIFE_PORTAL_2 = "AfterlifePortal2";
    
    public static readonly AFTERLIFE_4 = "Afterlife4";
    
    public static readonly AFTERLIFE_5 = "Afterlife5";
    
    public static readonly AFTERLIFE_6 = "Afterlife6";
    
    public static readonly AFTERLIFE_TMM = "AfterlifeTMM";
    
    public static readonly AFTERLIFE_ALLEY = "AfterlifeAlley";
    
    public static readonly AFTERLIFE_ADJUDICATOR = "AfterlifeAdjudicator";
    
    public static readonly TIME_FORTRESS_AZRAEL = "TimeFortressAzrael";
    
    public static readonly TIME_FORTRESS_MAIN = "TimeFortressMain";
    
    public static readonly TIME_FORTRESS_RIGHT_1 = "TimeFortressRight1";
    
    public static readonly TIME_FORTRESS_RIGHT_2 = "TimeFortressRight2";
    
    public static readonly TIME_FORTRESS_RIGHT_2_UP = "TimeFortressRight2Up";
    
    public static readonly TIME_FORTRESS_RIGHT_3 = "TimeFortressRight3";
    
    public static readonly TIME_FORTRESS_RIGHT_4 = "TimeFortressRight4";
    
    public static readonly TIME_FORTRESS_RIGHT_5 = "TimeFortressRight5";
    
    public static readonly TIME_FORTRESS_RIGHT_6 = "TimeFortressRight6";
    
    public static readonly ARCHIVES_INTERIOR = "ArchivesInterior";
    
    public static readonly ARCHIVES_INTERIOR_2 = "ArchivesInterior2";
    
    public static readonly ARCHIVES_MAIN = "ArchivesMain";
    
    public static readonly BARRENS_TRAIN = "BarrensTrain";
    
    public static readonly BARRENS_TRAIN_RIGHT = "BarrensTrainRight";
    
    public static readonly BAZAAR_ENTRANCE = "BazaarEntrance";
    
    public static readonly BAZAAR_FAR_RIGHT = "BazaarFarRight";
    
    public static readonly BAZAAR_FAR_LEFT = "BazaarFarLeft";
    
    public static readonly BARRENS_TURRET_FIELD = "BarrensTurretField";
    
    public static readonly BARRENS_TURRET_FIELD_2 = "BarrensTurretField2";
    
    public static readonly DRAGONOID_SHIP = "DragonoidShip";
    
    public static readonly DRAGONOID_SHIP_RIGHT = "DragonoidShipRight";
    
    public static readonly BAZAAR_PATH_1 = "BazaarPath1";
    
    public static readonly BAZAAR_PATH_2 = "BazaarPath2";
    
    public static readonly BAZAAR_PATH_3 = "BazaarPath3";
    
    public static readonly BAZAAR_PATH_4 = "BazaarPath4";
    
    public static readonly BIO_ENTRANCE = "BioEntrance";
    
    public static readonly BIO_FAR_RIGHT = "BioFarRight";
    
    public static readonly BIO_FAR_LEFT = "BioFarLeft";
    
    public static readonly BIO_LOBBY_LEFT = "BioLobbyLeft";
    
    public static readonly BIO_LOBBY = "BioLobby";
    
    public static readonly BIO_LOBBY_RIGHT = "BioLobbyRight";
    
    public static readonly BIO_FOREST_CENTER = "BioForestCenter";
    
    public static readonly BIO_FOREST_RIGHT = "BioForestRight";
    
    public static readonly BIO_FOREST_LEFT = "BioForestLeft";
    
    public static readonly BIO_FOREST_LEFT_2 = "BioForestLeft2";
    
    public static readonly BIO_FOREST_HOLE = "BioForestHole";
    
    public static readonly CITY_ENTRANCE = "CityEntrance";
    
    public static readonly CITY_FAR_RIGHT = "CityFarRight";
    
    public static readonly CITY_FAR_LEFT = "CityFarLeft";
    
    public static readonly CITY_GATE_MAIN = "CityGateMain";
    
    public static readonly CITY_SQUARE_CENTER = "CitySquareCenter";
    
    public static readonly CITY_SQUARE_LEFT_1 = "CitySquareLeft1";
    
    public static readonly CITY_SQUARE_LEFT_2 = "CitySquareLeft2";
    
    public static readonly CITY_SQUARE_RIGHT_1 = "CitySquareRight1";
    
    public static readonly CITY_SQUARE_RIGHT_2 = "CitySquareRight2";
    
    public static readonly CAVE_ENTRANCE = "CaveEntrance";
    
    public static readonly CAVE_RIGHT_1 = "CaveRight1";
    
    public static readonly CAVE_RIGHT_2 = "CaveRight2";
    
    public static readonly DREAD_PLAINS_MAIN = "DreadPlainsMain";
    
    public static readonly DREAD_PLAINS_INTERIOR = "DreadPlainsInterior";
    
    public static readonly DREAD_PLAINS_CONTROL_ARRAY = "DreadPlainsControlArray";
    
    public static readonly DREAD_PLAINS_RIGHT = "DreadPlainsRight";
    
    public static readonly DREAD_PLAINS_RIGHT2 = "DreadPlainsRight2";
    
    public static readonly DREAD_PLAINS_RIGHT3 = "DreadPlainsRight3";
    
    public static readonly DREAD_PLAINS_LEFT = "DreadPlainsLeft";
    
    public static readonly DREAD_PLAINS_LEFT2 = "DreadPlainsLeft2";
    
    public static readonly DREAD_PLAINS_LEFT3 = "DreadPlainsLeft3";
    
    public static readonly DREAD_PLAINS_LEFT4 = "DreadPlainsLeft4";
    
    public static readonly GUARD_OUTPOST = "GuardOutpost";
    
    public static readonly HANKS_BACK_ALLEY = "HanksBackAlley";
    
    public static readonly HANKS_LEFT = "HanksLeft";
    
    public static readonly HANKS_MAIN = "HanksMain";
    
    public static readonly HOME_1_1 = "HOME_1_1";
    
    public static readonly HOME_1_2 = "HOME_1_2";
    
    public static readonly HOME_2_1 = "HOME_2_1";
    
    public static readonly HOME_2_2 = "HOME_2_2";
    
    public static readonly HOME_3_1 = "HOME_3_1";
    
    public static readonly HOME_3_2 = "HOME_3_2";
    
    public static readonly HOME_3_3 = "HOME_3_3";
    
    public static readonly HOME_4_1 = "HOME_4_1";
    
    public static readonly HOME_4_2 = "HOME_4_2";
    
    public static readonly HOME_4_3 = "HOME_4_3";
    
    public static readonly HOME_5_1 = "HOME_5_1";
    
    public static readonly HOME_5_2 = "HOME_5_2";
    
    public static readonly HOME_6_1 = "HOME_6_1";
    
    public static readonly HOME_6_2 = "HOME_6_2";
    
    public static readonly HOME_6_3 = "HOME_6_3";
    
    public static readonly HOME_7_1 = "HOME_7_1";
    
    public static readonly HOME_7_2 = "HOME_7_2";
    
    public static readonly HOME_8_1 = "HOME_8_1";
    
    public static readonly HOME_9_1 = "HOME_9_1";
    
    public static readonly HOME_9_2 = "HOME_9_2";
    
    public static readonly HOME_10_1 = "HOME_10_1";
    
    public static readonly HOME_10_2 = "HOME_10_2";
    
    public static readonly HOME_11_1 = "HOME_11_1";
    
    public static readonly HOME_11_2 = "HOME_11_2";
    
    public static readonly HOME_12_1 = "HOME_12_1";
    
    public static readonly HOME_12_2 = "HOME_12_2";
    
    public static readonly HOME_12_3 = "HOME_12_3";
    
    public static readonly HOME_13_1 = "HOME_13_1";
    
    public static readonly HOME_13_2 = "HOME_13_2";
    
    public static readonly HOME_13_3 = "HOME_13_3";
    
    public static readonly HOME_14_1 = "HOME_14_1";
    
    public static readonly HOME_14_2 = "HOME_14_2";
    
    public static readonly HOME_14_3 = "HOME_14_3";
    
    public static readonly HOME_15_1 = "HOME_15_1";
    
    public static readonly HOME_15_2 = "HOME_15_2";
    
    public static readonly HOME_15_3 = "HOME_15_3";
    
    public static readonly FACT_1_1 = "FACT_1_1";
    
    public static readonly FACT_1_2 = "FACT_1_2";
    
    public static readonly FACT_1_3 = "FACT_1_3";
    
    public static readonly FACT_1_4 = "FACT_1_4";
    
    public static readonly FACT_1_5 = "FACT_1_5";
    
    public static readonly FACT_2_1 = "FACT_2_1";
    
    public static readonly FACT_2_2 = "FACT_2_2";
    
    public static readonly FACT_2_3 = "FACT_2_3";
    
    public static readonly FACT_2_4 = "FACT_2_4";
    
    public static readonly FACT_2_5 = "FACT_2_5";
    
    public static readonly TESTING_MAP_1_A = "TestingMap1A";
    
    public static readonly FELDSPAR_FLATS_1 = "FeldsparFlats1";
    
    public static readonly FELDSPAR_FLATS_2 = "FeldsparFlats2";
    
    public static readonly FELDSPAR_FLATS_3 = "FeldsparFlats3";
    
    public static readonly FELDSPAR_FLATS_4 = "FeldsparFlats4";
    
    public static readonly FELDSPAR_FLATS_5 = "FeldsparFlats5";
    
    public static readonly FELDSPAR_FLATS_6 = "FeldsparFlats6";
    
    public static readonly TRAIN_HUB_OUTSIDE = "TrainHubOutside";
    
    public static readonly FRYSTELAND_MAIN = "FrystelandMain";
    
    public static readonly FRYSTELAND_MAIN_RIGHT = "FrystelandMainRight";
    
    public static readonly FRYSTELAND_MAIN_LEFT = "FrystelandMainLeft";
    
    public static readonly FRYSTELAND_INTERIOR = "FrystelandInterior";
    
    public static readonly FRYSTELAND_INTERIOR_2 = "FrystelandInterior2";
    
    public static readonly FRYSTELAND_INTERIOR_2_RIGHT = "FrystelandInterior2Right";
    
    public static readonly FRYSTELAND_INTERIOR_2_LEFT = "FrystelandInterior2Left";
    
    public static readonly FRYSTELAND_LEFT = "FrystelandLeft";
    
    public static readonly FRYSTELAND_RIGHT = "FrystelandRight";
    
    public static readonly FRYSTELAND_EXILE_MAIN = "FrystelandExileMain";
    
    public static readonly FRYSTELAND_EXILE_INTERIOR = "FrystelandExileInterior";
    
    public static readonly FRYSTELAND_EXILE_CORE = "FrystelandExileCore";
    
    public static readonly FRYSTELAND_LEGION_MAIN = "FrystelandLegionMain";
    
    public static readonly FRYSTELAND_LEGION_INTERIOR = "FrystelandLegionInterior";
    
    public static readonly FRYSTELAND_LEGION_CORE = "FrystelandLegionCore";
    
    public static readonly LEGION_ARENA = "LegionArena";
    
    public static readonly INFERNAL_MINES = "InfernalMines";
    
    public static readonly INFERNAL_MINES_PLATFORM = "InfernalMinesPlatform";
    
    public static readonly INFERNAL_MINES_MIDDLE = "InfernalMinesMiddle";
    
    public static readonly WAR_INFERNAL_MINES_RIGHT = "WarInfernalMinesRight";
    
    public static readonly WAR_INFERNAL_MINES_RIGHT_2 = "WarInfernalMinesRight2";
    
    public static readonly WAR_INFERNAL_MINES_LEFT = "WarInfernalMinesLeft";
    
    public static readonly WAR_INFERNAL_MINES_LEFT_2 = "WarInfernalMinesLeft2";
    
    public static readonly WAR_INFERNAL_MINES_EXILE_VAULT_BROKEN = "WarExileVaultBroken";
    
    public static readonly WAR_INFERNAL_MINES_EXILE_VAULT_2_BROKEN = "WarExileVault2Broken";
    
    public static readonly WAR_INFERNAL_MINES_EXILE_VAULT_3_BROKEN = "WarExileVault3Broken";
    
    public static readonly WAR_INFERNAL_MINES_EXILE_VAULT_4_BROKEN = "WarExileVault4Broken";
    
    public static readonly WAR_DELTA_VAULT_EXILE = "WarDeltaVaultExile";
    
    public static readonly MINETOWER_FAR_LEFT = "MinetowerFarLeft";
    
    public static readonly MINETOWER_FAR_LEFT_2 = "MinetowerFarLeft2";
    
    public static readonly MINETOWER_FAR_RIGHT = "MinetowerFarRight";
    
    public static readonly MINETOWER_FAR_RIGHT_2 = "MinetowerFarRight2";
    
    public static readonly MINETOWER_NIGHTMARE = "MinetowerNightmare";
    
    public static readonly MINETOWER_BASE_FAR = "MinetowerBaseFar";
    
    public static readonly MINETOWER_BASE_LEFT = "MinetowerBaseLeft";
    
    public static readonly MINETOWER_BASE_RIGHT = "MinetowerBaseRight";
    
    public static readonly MINETOWER_BASE_OUTSIDE = "MinetowerBaseOutside";
    
    public static readonly GOD_OF_WAR_CHAMBER = "GodOfWarChamber";
    
    public static readonly MINETOWER_LOBBY_LEFT = "MinetowerLobbyLeft";
    
    public static readonly MINETOWER_LOBBY_RIGHT = "MinetowerLobbyRight";
    
    public static readonly DAGE_AND_DARKON = "DageAndDarkon";
    
    public static readonly MINETOWER_SUITE_TOP = "MinetowerSuiteTop";
    
    public static readonly MINETOWER_SUITE = "MinetowerSuite";
    
    public static readonly MINETOWER_SUITE_LEFT = "MinetowerSuiteLeft";
    
    public static readonly MINETOWER_SUITE_ENTRANCE = "MinetowerSuiteEntrance";
    
    public static readonly MINETOWER_SURFACE_ENTRANCE = "MinetowerSurfaceEntrance";
    
    public static readonly MINES_GATE = "MinesGate";
    
    public static readonly MINES_INNER_CENTER = "MinesInnerCenter";
    
    public static readonly MINES_INNER_LEFT = "MinesInnerLeft";
    
    public static readonly MINES_INNER_RIGHT = "MinesInnerRight";
    
    public static readonly MINESTATION_CENTER = "MinestationCenter";
    
    public static readonly MINESTATION_LEFT = "MinestationLeft";
    
    public static readonly MINESTATION_RIGHT = "MinestationRight";
    
    public static readonly MIRVS_SHOP = "MirvsShop";
    
    public static readonly NAVAL_YARD_ENTRANCE = "NavalYardEntrance";
    
    public static readonly NAVAL_YARD_MIDDLE = "NavalYardMiddle";
    
    public static readonly NAVAL_YARD_SHACK = "NavalYardShack";
    
    public static readonly NAVAL_YARD_SHACK_RIGHT = "NavalYardShackRight";
    
    public static readonly NAVAL_YARD_SHACK_INTERIOR = "NavalYardShackInterior";
    
    public static readonly NAVAL_YARD_SHACK_INTERIOR_RIGHT = "NavalYardShackInteriorRight";
    
    public static readonly NAVAL_YARD_KRAKEN = "NavalYardKraken";
    
    public static readonly NAVAL_YARD_KRAKEN_2 = "NavalYardKraken2";
    
    public static readonly NAVAL_YARD_UNDER_1 = "NavalYardUnder1";
    
    public static readonly NAVAL_YARD_UNDER_2 = "NavalYardUnder2";
    
    public static readonly NAVAL_YARD_UNDER_3 = "NavalYardUnder3";
    
    public static readonly OLD_FORTUNE_CITY_1 = "OldFortuneCity1";
    
    public static readonly OLD_FORTUNE_CITY_2 = "OldFortuneCity2";
    
    public static readonly OLD_FORTUNE_CITY_3 = "OldFortuneCity3";
    
    public static readonly OVERLORD_MAIN = "OverlordMain";
    
    public static readonly OVERLORD_MAIN_LEFT = "OverlordMainLeft";
    
    public static readonly OVERLORD_MAIN_RIGHT = "OverlordMainRight";
    
    public static readonly OVERLORD_MAIN_CLIFF = "OverlordMainCliff";
    
    public static readonly OVERLORD_OUTSIDE = "OverlordOutside";
    
    public static readonly OVERLORD_BASE = "OverlordBase";
    
    public static readonly OVERLORD_THRONE_ROOM = "OverlordThroneRoom";
    
    public static readonly REFINERY_ENTRANCE = "RefineryEntrance";
    
    public static readonly SCIENCE_FACILITY_MAIN = "ScienceFacilityMain";
    
    public static readonly SCIENCE_FACILITY_LEFT = "ScienceFacilityLeft";
    
    public static readonly SPIRE_ENTRANCE = "SpireEntrance";
    
    public static readonly STEVES_CENTER = "StevesCenter";
    
    public static readonly SPECTATOR_ARENA = "SpectatorArena";
    
    public static readonly TITAN_PEAK = "TitanPeak";
    
    public static readonly TITAN_PEAK_RIGHT = "TitanPeakRight";
    
    public static readonly TITAN_PEAK_RIGHT_2 = "TitanPeakRight2";
    
    public static readonly TITAN_PEAK_RIGHT_3 = "TitanPeakRight3";
    
    public static readonly TITAN_PEAK_RIGHT_4 = "TitanPeakRight4";
    
    public static readonly TITAN_PEAK_RIGHT_5 = "TitanPeakRight5";
    
    public static readonly TITAN_PEAK_UP_LEFT = "TitanPeakUpLeft";
    
    public static readonly TITAN_PEAK_LEFT = "TitanPeakLeft";
    
    public static readonly TITAN_PEAK_LEFT_2 = "TitanPeakLeft2";
    
    public static readonly TITAN_PEAK_LEFT_3 = "TitanPeakLeft3";
    
    public static readonly LEGENDARY_CHAMBER = "LegendaryChamber";
    
    public static readonly TITAN_PEAK_BASE = "TitanPeakBase";
    
    public static readonly TRAIN_HUB_CENTER = "TrainHubCenter";
    
    public static readonly TRAIN_HUB_LEFT = "TrainHubLeft";
    
    public static readonly TRAIN_HUB_LEFT_2 = "TrainHubLeft2";
    
    public static readonly TRAIN_HUB_LEFT_3 = "TrainHubLeft3";
    
    public static readonly TRAIN_HUB_LEFT_4 = "TrainHubLeft4";
    
    public static readonly TRAIN_HUB_RIGHT = "TrainHubRight";
    
    public static readonly TRAIN_HUB_B_LEFT = "TrainHubBLeft";
    
    public static readonly TRAIN_HUB_B_CENTER = "TrainHubBCenter";
    
    public static readonly TRAIN_HUB_B_RIGHT = "TrainHubBRight";
    
    public static readonly BAR_MAIN = "BarMain";
    
    public static readonly BAR_RIGHT_1 = "BarRight1";
    
    public static readonly BAR_RIGHT_2 = "BarRight2";
    
    public static readonly ULYSSES_BUNKER_BACK_LEFT = "UlyssesBunkerBackLeft";
    
    public static readonly ULYSSES_BUNKER_BACK_RIGHT = "UlyssesBunkerBackRight";
    
    public static readonly ULYSSES_BUNKER_FRONT = "UlyssesBunkerFront";
    
    public static readonly ULYSSES_BUNKER = "UlyssesBunker";
    
    public static readonly VALESTRAS_MAIN = "ValestrasMain";
    
    public static readonly VALESTRAS_RIGHT_1 = "ValestrasRight1";
    
    public static readonly VALESTRAS_RIGHT_2 = "ValestrasRight2";
    
    public static readonly VALESTRAS_ARCADE = "ValestrasArcade";
    
    public static readonly VALESTRAS_ARCADE_LEFT = "ValestrasArcadeLeft";
    
    public static readonly WASTELAND_SPIDER_DEN = "WastelandSpiderDen";

    public static roomVersions: RoomManagerRecord[] = [];
    
    public static MSRS_FELDSPAR_FLATS_2:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,970,383),new MSR_OwnItemOrMissionComplete(2,970,383)));
    
    public static MSRS_FELDSPAR_FLATS_3:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,970,384),new MSR_OwnItemOrMissionComplete(2,970,384)));
    
    public static MSRS_FELDSPAR_FLATS_4:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("junkerA_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,1889,385),new MSR_OwnItemOrMissionComplete(2,1889,385)),new MapObjectGroup("junkerB_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,1890,385),new MSR_OwnItemOrMissionComplete(2,1890,385)));
    
    public static MSRS_FELDSPAR_FLATS_5:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,1883,386),new MSR_OwnItemOrMissionComplete(2,1883,386)));
    
    public static MSRS_FELDSPAR_FLATS_6:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_DoesNotOwnItemAndMissionIncomplete(1,1883,387),new MSR_OwnItemOrMissionComplete(2,1883,387)));
    
    public static MSRS_TRAINHUB_OUTSIDE:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_NoAlignmentOrNoMissionCompleteInSet(1,[388,389]),new MSR_HasAlignmentAndAnyMissionCompleteInSet(2,[388,389])),new MapObjectGroup("align_",new MSR_NoAlignment(1)));
    
    public static MSRS_FRYSTELAND_EXILE_INTERIOR:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,550),new MSR_MissionComplete(2,550)));
    
    public static MSRS_ARCHIVES_INTERIOR_2:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,606),new MSR_MissionComplete(2,606)));
    
    public static MSRS_WAR_INFERNAL_MINES_LEFT_2:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,651),new MSR_MissionComplete(2,651)));
    
    public static MSRS_BARRENS_TURRET_FIELD:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,667),new MSR_MissionComplete(2,667)));
    
    public static MSRS_MINETOWER_BASE_OUTSIDE:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,713),new MSR_MissionComplete(2,713)));
    
    public static MSRS_GOD_OF_WAR_CHAMBER:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,713),new MSR_MissionComplete(2,713)));
    
    public static MSRS_AFTERLIFE_PORTAL_2:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,900),new MSR_MissionComplete(2,900)));
    
    public static MSRS_BIO_FOREST_HOLE:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,1178),new MSR_MissionComplete(2,1178)));
    
    public static MSRS_AFTERLIFE_6:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,1208),new MSR_MissionComplete(2,1208)));
    
    public static MSRS_AFTERLIFE_ADJUDICATOR:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,1208),new MSR_MissionComplete(2,1208)));
    
    public static MSRS_AFTERLIFE_PORTAL:MapStateRuleSet = new MapStateRuleSet(new MapObjectGroup("state_",new MSR_MissionNotComplete(1,910),new MSR_MissionComplete(2,910)));

    protected static init() {
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_1,1,[450,450],[268,271],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(3646,500,400,true,899))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_2,3,[450,450],[272],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(3036,425,460,true,742))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_3,2,[450,450],[269,273,274],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(2402,600,400,true,576))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_THRONE,5,[450,450],[278],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(2407,300,400,true,576),new MapItemRule(2637,548,328,true,677),new MapItemRule(3040,608,417,true,742))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_PORTAL,2,[450,450],[341],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,RoomManager.MSRS_AFTERLIFE_PORTAL,new MapItemRuleSet(new MapItemRule(3648,400,400,true,899),new MapItemRule(4626,708,370,true,1066))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_PORTAL_2,1,[450,450],[312],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_AFTERLIFE_NIGHTMARE],RoomManager.MSRS_AFTERLIFE_PORTAL_2,new MapItemRuleSet(new MapItemRule(3655,450,350,true,900))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_4,2,[450,450],[275,276],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(2401,420,420,true,567),new MapItemRule(2406,600,475,true,576))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_5,4,[450,500],[277],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,new MapItemRuleSet(new MapItemRule(3647,500,400,true,899),new MapItemRule(3041,542,415,true,742))));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_6,3,[450,500],[286,334],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,RoomManager.MSRS_AFTERLIFE_6,null));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_TMM,1,[450,500],[270],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_AFTERLIFE_TMMBOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_ALLEY,2,[450,500],[328],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.AFTERLIFE_ADJUDICATOR,1,[450,500],[332,330],RoomManager.REGION_AFTERLIFE_ID,[0,0,1,1],0,[RoomManager.BG_AFTERLIFE_ADJUDICATORBOSS],RoomManager.MSRS_AFTERLIFE_ADJUDICATOR,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_AZRAEL,3,[450,500],[335],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_AFTERLIFE_AZRAELBOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_MAIN,1,[450,500],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_1,1,[450,500],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_2,2,[450,500],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_2_UP,4,[450,500],[351],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_3,1,[450,500],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_4,2,[450,500],[336,340],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_AFTERLIFE_ACATRIELBOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_5,1,[450,500],[343],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TIME_FORTRESS_RIGHT_6,1,[450,500],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,[RoomManager.BG_TIME_FORTRESS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.ARCHIVES_INTERIOR,9,[450,450],[121,120],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],29,[RoomManager.BG_BIODOME_ARCHIVES_INTERIOR],null,new MapItemRuleSet(new MapItemRule(2086,685,575,true,448),new MapItemRule(2326,667,533,true,534))));
        this.roomVersions.push(new RoomManagerRecord(this.ARCHIVES_INTERIOR_2,9,[450,450],[279,280,114,113,116],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,RoomManager.MSRS_ARCHIVES_INTERIOR_2,null));
        this.roomVersions.push(new RoomManagerRecord(this.ARCHIVES_MAIN,7,[450,450],[119,115],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(2090,670,590,true,450))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_ENTRANCE,10,[450,450],[41,39],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(2087,71,460,true,448))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FAR_RIGHT,10,[450,500],[81],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FAR_LEFT,12,[450,500],[],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],27,[RoomManager.BG_BIODOME_TURRET],null,new MapItemRuleSet(new MapItemRule(2088,57,542,true,448),new MapItemRule(4826,664,453,true,1170))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_LOBBY_LEFT,15,[450,450],[47],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],28,[RoomManager.BG_BIODOME_SHIELD_GENERATOR],null,new MapItemRuleSet(new MapItemRule(2017,168,465,true,427),new MapItemRule(2091,180,535,true,450),new MapItemRule(1229,480,365,true,596),new MapItemRule(4769,236,469,true,1097),new MapItemRule(4825,506,443,true,1170))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_LOBBY,23,[450,450],[40,82],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(1674,786,169,true,346),new MapItemRule(1705,181,488,true,361))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_LOBBY_RIGHT,27,[450,450],[20,6],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,[RoomManager.BG_BIODOME_AMMO_DEPOT],null,new MapItemRuleSet(new MapItemRule(1677,160,174,true,346),new MapItemRule(1742,191,363,true,379))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FOREST_RIGHT,7,[450,450],[60,117],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(1678,194,258,true,346))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FOREST_LEFT,2,[450,450],[165,263],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(2551,356,409,true,642),new MapItemRule(4697,206,474,true,1068))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FOREST_LEFT_2,1,[450,450],[],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(4824,809,466,true,1170))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FOREST_HOLE,1,[450,450],[331,333],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,[RoomManager.BG_BIODOME_HOLE],RoomManager.MSRS_BIO_FOREST_HOLE,new MapItemRuleSet(new MapItemRule(4828,217,422,true,1174),new MapItemRule(4829,592,427,true,1178))));
        this.roomVersions.push(new RoomManagerRecord(this.BIO_FOREST_CENTER,12,[450,450],[],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],30,this.BG_SET_BIODOME,null,new MapItemRuleSet(new MapItemRule(1697,189,431,true,355),new MapItemRule(2092,180,513,true,450))));
        this.roomVersions.push(new RoomManagerRecord(this.BARRENS_TRAIN,18,[450,450],[66,81,55],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,new MapItemRuleSet(new MapItemRule(4837,245,430,true,1192))));
        this.roomVersions.push(new RoomManagerRecord(this.BARRENS_TRAIN_RIGHT,2,[450,450],[295],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,new MapItemRuleSet(new MapItemRule(2631,650,380,true,664),new MapItemRule(4124,497,376,true,964),new MapItemRule(4838,793,442,true,1192))));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_ENTRANCE,14,[450,450],[79],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],33,[RoomManager.BG_BARRENS_OUTPOST_BAZAAR_ENTRANCE],null,new MapItemRuleSet(new MapItemRule(1737,288,404,true,376),new MapItemRule(2228,600,428,true,487),new MapItemRule(2454,585,470,true,606))));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_FAR_RIGHT,18,[450,425],[34,294],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],32,this.BG_SET_BARRENS_OUTPOST,null,new MapItemRuleSet(new MapItemRule(2016,410,460,true,420),new MapItemRule(2630,185,370,true,664))));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_FAR_LEFT,20,[450,425],[6,293],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],31,[RoomManager.BG_BARRENS_OUTPOST_PROPAGANDA_TOWER],null,new MapItemRuleSet(new MapItemRule(2629,370,365,true,664),new MapItemRule(4122,400,366,true,959))));
        this.roomVersions.push(new RoomManagerRecord(this.BARRENS_TURRET_FIELD,11,[450,425],[36,137,267,298],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,[RoomManager.BG_BARRENS_OUTPOST_SHIELD_GENERATOR],RoomManager.MSRS_BARRENS_TURRET_FIELD,new MapItemRuleSet(new MapItemRule(2015,740,480,true,420),new MapItemRule(2632,365,380,true,668),new MapItemRule(3042,655,528,true,761),new MapItemRule(4123,532,346,true,964))));
        this.roomVersions.push(new RoomManagerRecord(this.BARRENS_TURRET_FIELD_2,12,[450,425],[291,292],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],34,[RoomManager.BG_BARRENS_OUTPOST_TURRET_ARRAY],null,new MapItemRuleSet(new MapItemRule(2628,550,390,true,661),new MapItemRule(3037,520,448,true,758))));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_PATH_1,11,[350,530],[77],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_PATH_2,6,[450,480],[],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_PATH_3,7,[450,480],[],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAZAAR_PATH_4,9,[500,450],[],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,new MapItemRuleSet(new MapItemRule(2008,520,465,true,427))));
        this.roomVersions.push(new RoomManagerRecord(this.DRAGONOID_SHIP,3,[450,450],[296,297,301],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,1,1],0,[RoomManager.BG_BARRENS_OUTPOST_DRAGONOID_SHIP],null,new MapItemRuleSet(new MapItemRule(2638,325,330,true,679))));
        this.roomVersions.push(new RoomManagerRecord(this.DRAGONOID_SHIP_RIGHT,1,[450,450],[310,311],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,1,1],0,[RoomManager.BG_BARRENS_OUTPOST_DRAGONOID_SHIP],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MIRVS_SHOP,20,[350,450],[18,76,125],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,[RoomManager.BG_BARRENS_OUTPOST_MIRVS_SHOP],null,new MapItemRuleSet(new MapItemRule(1706,563,369,true,361),new MapItemRule(1738,49,431,true,379),new MapItemRule(2169,81,432,true,463))));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_CENTER,21,[450,450],[249,14,80],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,[RoomManager.BG_CENTRAL_STATION_SHIELD_GENERATOR],null,new MapItemRuleSet(new MapItemRule(2171,562,394,true,463),new MapItemRule(2718,275,456,true,712))));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_LEFT,25,[450,450],[32,305],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,this.BG_SET_CENTRAL_STATION,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_LEFT_2,14,[450,450],[35,78],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,this.BG_SET_CENTRAL_STATION,null,new MapItemRuleSet(new MapItemRule(1938,290,530,true,393))));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_LEFT_3,18,[450,450],[],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],42,[RoomManager.BG_CENTRAL_STATION_COMMAND_HUB],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_RIGHT,28,[450,450],[6,329],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],41,[RoomManager.BG_CENTRAL_STATION_TOWER],null,new MapItemRuleSet(new MapItemRule(1939,620,440,true,393))));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_LEFT_4,15,[450,450],[22],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,this.BG_SET_CENTRAL_STATION,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_B_LEFT,15,[450,450],[31,247],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],39,[RoomManager.BG_CENTRAL_STATION_AMMO_DEPOT],null,new MapItemRuleSet(new MapItemRule(1741,228,523,true,379),new MapItemRule(1937,240,430,true,393))));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_B_CENTER,15,[450,450],[248,48,32],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,[RoomManager.BG_CENTRAL_STATION_TURRET],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_B_RIGHT,24,[450,450],[167,168],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],40,this.BG_SET_CENTRAL_STATION,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAR_MAIN,1,[450,450],[347],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,[RoomManager.BG_BAR_BACK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAR_RIGHT_1,2,[450,450],[344],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,[RoomManager.BG_BAR_BACK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.BAR_RIGHT_2,2,[450,450],[348],RoomManager.REGION_CENTRAL_STATION_ID,[0,0,0,0],0,[RoomManager.BG_BAR_BACK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.CAVE_ENTRANCE,1,[450,470],[0],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,[RoomManager.BG_DREAD_PLAINS_LUTHIEL_BOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.CAVE_RIGHT_1,1,[450,470],[0],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,[RoomManager.BG_DREAD_PLAINS_LUTHIEL_BOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.CAVE_RIGHT_2,1,[450,470],[337],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,[RoomManager.BG_DREAD_PLAINS_LUTHIEL_BOSS],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_MAIN,7,[450,470],[139,140,169,87],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_DREAD_PLAINS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_INTERIOR,4,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_DREAD_PLAINS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_CONTROL_ARRAY,10,[450,470],[6],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],5,[RoomManager.BG_DREAD_PLAINS_CONTROL_ARRAY],null,new MapItemRuleSet(new MapItemRule(1703,618,197,true,358))));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_RIGHT,10,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],1,[RoomManager.BG_DREAD_PLAINS_RADAR_ARRAY],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_RIGHT2,8,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,[RoomManager.BG_DREAD_PLAINS_RIGHT_TOWER],null,new MapItemRuleSet(new MapItemRule(1736,848,447,true,376))));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_RIGHT3,11,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],2,[RoomManager.BG_DREAD_PLAINS_SHIELD_GENERATOR],null,new MapItemRuleSet(new MapItemRule(4699,574,410,true,1068))));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_LEFT,10,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],3,[RoomManager.BG_DREAD_PLAINS_MISSILE_TURRET],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_LEFT2,9,[450,470],[173],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,[RoomManager.BG_DREAD_PLAINS_LEFT_TOWER],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_LEFT3,11,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],4,[RoomManager.BG_DREAD_PLAINS_AMMO_DEPOT],null,new MapItemRuleSet(new MapItemRule(1739,144,417,true,379))));
        this.roomVersions.push(new RoomManagerRecord(this.DREAD_PLAINS_LEFT4,1,[450,470],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],4,[RoomManager.BG_DREAD_PLAINS_LUTHIEL_BOSS],null,new MapItemRuleSet(new MapItemRule(1739,144,417,true,379))));
        this.roomVersions.push(new RoomManagerRecord(this.TESTING_MAP_1_A,1,[450,450],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_FELDSPAR_FLATS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_1,3,[450,450],[],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,this.BG_SET_FELDSPAR_FLATS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_2,3,[450,450],[230,223],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,this.BG_SET_FELDSPAR_FLATS,RoomManager.MSRS_FELDSPAR_FLATS_2,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_3,3,[450,450],[231,224],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,this.BG_SET_FELDSPAR_FLATS,RoomManager.MSRS_FELDSPAR_FLATS_3,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_4,3,[450,450],[232,225,226],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,[RoomManager.BG_FELDSPAR_FLATS_WALL],RoomManager.MSRS_FELDSPAR_FLATS_4,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_5,3,[450,450],[233,228],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,[RoomManager.BG_FELDSPAR_FLATS_WALL],RoomManager.MSRS_FELDSPAR_FLATS_5,null));
        this.roomVersions.push(new RoomManagerRecord(this.FELDSPAR_FLATS_6,3,[450,450],[234,237],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,[RoomManager.BG_FELDSPAR_FLATS_WALL],RoomManager.MSRS_FELDSPAR_FLATS_6,null));
        this.roomVersions.push(new RoomManagerRecord(this.TRAIN_HUB_OUTSIDE,5,[450,450],[235,236],RoomManager.REGION_FELDSPAR_FLATS_ID,[0,0,0,1],0,[RoomManager.BG_FELDSPAR_FLATS_EXIT],RoomManager.MSRS_TRAINHUB_OUTSIDE,null));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_ENTRANCE,26,[390,490],[109],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(3640,350,425,true,881))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_FAR_RIGHT,14,[450,450],[81,112],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(1702,452,408,true,354),new MapItemRule(1934,535,407,true,390))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_FAR_LEFT,26,[450,470],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],9,[RoomManager.BG_FORTUNE_CITY_OUTER_GATE],null,new MapItemRuleSet(new MapItemRule(2453,140,470,true,597))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_GATE_MAIN,19,[500,450],[9,6,63],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(1695,202,374,true,355),new MapItemRule(1933,240,467,true,390))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_SQUARE_CENTER,19,[300,480],[83,326],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,[RoomManager.BG_FORTUNE_CITY_SPIRE_TURRET],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_SQUARE_LEFT_1,18,[450,450],[6,111],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,[RoomManager.BG_FORTUNE_CITY_BATTLE_ARENA_OUTSIDE],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_SQUARE_LEFT_2,11,[450,450],[85,16,27],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(3639,500,450,true,881),new MapItemRule(1701,264,432,true,354))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_SQUARE_RIGHT_1,15,[450,450],[13],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(1935,390,450,true,390))));
        this.roomVersions.push(new RoomManagerRecord(this.CITY_SQUARE_RIGHT_2,9,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],7,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(3638,450,500,true,881))));
        this.roomVersions.push(new RoomManagerRecord(this.GUARD_OUTPOST,19,[450,470],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],6,[RoomManager.BG_FORTUNE_CITY_GUARD_OUTPOST],null,new MapItemRuleSet(new MapItemRule(2707,580,450,true,695))));
        this.roomVersions.push(new RoomManagerRecord(this.HANKS_BACK_ALLEY,10,[450,470],[6],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(4625,821,437,true,1066))));
        this.roomVersions.push(new RoomManagerRecord(this.HANKS_LEFT,8,[450,450],[23],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HANKS_MAIN,23,[400,460],[2],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(2170,322,343,true,463))));
        this.roomVersions.push(new RoomManagerRecord(this.LEGION_ARENA,10,[450,510],[73,81],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,[RoomManager.BG_FORTUNE_CITY_BATTLE_ARENA],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.OLD_FORTUNE_CITY_1,6,[450,450],[6],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.OLD_FORTUNE_CITY_2,12,[450,450],[181],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,[RoomManager.BG_FORTUNE_CITY_OLD_AMMO_DEPOT],null,new MapItemRuleSet(new MapItemRule(1740,202,397,true,379))));
        this.roomVersions.push(new RoomManagerRecord(this.OLD_FORTUNE_CITY_3,8,[450,450],[88],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(1936,580,430,true,390),new MapItemRule(4700,702,392,true,1068))));
        this.roomVersions.push(new RoomManagerRecord(this.SCIENCE_FACILITY_MAIN,12,[450,450],[21],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(2709,185,400,true,697))));
        this.roomVersions.push(new RoomManagerRecord(this.SCIENCE_FACILITY_LEFT,10,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],8,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(2018,720,570,true,427),new MapItemRule(4773,334,384,true,1096))));
        this.roomVersions.push(new RoomManagerRecord(this.SPIRE_ENTRANCE,15,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],10,[RoomManager.BG_FORTUNE_CITY_SPIRE_MAIN],null,new MapItemRuleSet(new MapItemRule(2550,630,400,true,645))));
        this.roomVersions.push(new RoomManagerRecord(this.STEVES_CENTER,15,[450,450],[7],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,new MapItemRuleSet(new MapItemRule(2058,735,550,true,432))));
        this.roomVersions.push(new RoomManagerRecord(this.VALESTRAS_MAIN,25,[450,450],[1,55],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.VALESTRAS_RIGHT_1,11,[450,450],[17,55],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.VALESTRAS_RIGHT_2,15,[450,450],[30,55],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.VALESTRAS_ARCADE,14,[450,450],[55,222],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.VALESTRAS_ARCADE_LEFT,12,[450,450],[55],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.SPECTATOR_ARENA,1,[450,450],[338,339],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_MAIN,17,[450,530],[6,104],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2248,714,544,true,492))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_MAIN_RIGHT,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_MAIN_LEFT,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_INTERIOR,11,[450,450],[156,107,157,110],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2455,300,420,true,600))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_INTERIOR_2,7,[450,450],[90,239],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2245,766,450,true,488),new MapItemRule(2332,712,435,true,543),new MapItemRule(2457,330,440,true,600))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_INTERIOR_2_RIGHT,3,[450,450],[163],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2328,819,395,true,535),new MapItemRule(4120,144,419,true,951))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_INTERIOR_2_LEFT,1,[450,450],[265],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2456,650,400,true,600),new MapItemRule(2699,630,350,true,690),new MapItemRule(4118,687,434,true,948))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_LEFT,9,[450,450],[158],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],11,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2292,376,354,true,516),new MapItemRule(2292,376,354,true,506),new MapItemRule(2342,804,385,true,542))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_RIGHT,10,[450,450],[159,106],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2415,500,450,true,581),new MapItemRule(2813,460,440,true,731))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_EXILE_MAIN,10,[450,450],[95],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],13,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2246,461,542,true,488))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_EXILE_INTERIOR,9,[450,450],[266,99,100,94],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,RoomManager.MSRS_FRYSTELAND_EXILE_INTERIOR,new MapItemRuleSet(new MapItemRule(2318,78,423,true,531),new MapItemRule(2334,848,395,true,543))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_EXILE_CORE,10,[450,450],[164,105],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2305,113,405,true,510),new MapItemRule(2319,71,393,true,531))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_LEGION_MAIN,11,[450,450],[84],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2223,260,405,true,477),new MapItemRule(2249,236,427,true,492),new MapItemRule(2293,198,339,true,516),new MapItemRule(2293,198,339,true,506),new MapItemRule(2305,101,424,true,520),new MapItemRule(2316,700,544,true,530),new MapItemRule(4119,626,434,true,951))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_LEGION_INTERIOR,10,[450,450],[160,108,96],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2338,746,450,true,542))));
        this.roomVersions.push(new RoomManagerRecord(this.FRYSTELAND_LEGION_CORE,11,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],14,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2317,688,345,true,530))));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK,9,[450,450],[59],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],12,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,new MapItemRuleSet(new MapItemRule(3642,450,450,true,887),new MapItemRule(1704,724,541,true,361),new MapItemRule(2327,841,441,true,534),new MapItemRule(4121,700,500,true,956))));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_RIGHT,2,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_RIGHT_2,3,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_RIGHT_3,6,[450,450],[309],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,new MapItemRuleSet(new MapItemRule(4628,187,394,true,1066))));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_RIGHT_4,3,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_RIGHT_5,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_UP_LEFT,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_LEFT,2,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_LEFT_2,2,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_LEFT_3,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.LEGENDARY_CHAMBER,3,[450,450],[282,283,284],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,[RoomManager.BG_FRYSTELAND_TITANS_PEAK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.TITAN_PEAK_BASE,7,[450,450],[97,98],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,new MapItemRuleSet(new MapItemRule(2244,160,462,true,488),new MapItemRule(2294,124,445,true,516),new MapItemRule(2294,124,445,true,506),new MapItemRule(2333,777,363,true,543))));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_1_1,7,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_1_2,5,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_2_1,6,[450,450],[],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_2_2,5,[450,450],[],RoomManager.REGION_BARRENS_OUTPOST_ID,[0,0,0,0],0,this.BG_SET_BARRENS_OUTPOST,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_3_1,6,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_3_2,5,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_3_3,5,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_4_1,6,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_4_2,5,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_4_3,5,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_5_1,6,[450,450],[],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_5_2,5,[450,450],[],RoomManager.REGION_BIOLOGICAL_PRESERVE_ID,[0,0,0,0],0,this.BG_SET_BIODOME,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_6_1,5,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_6_2,4,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_6_3,4,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_7_1,1,[450,450],[],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_7_2,1,[450,450],[],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_8_1,1,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_9_1,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_9_2,1,[450,450],[],RoomManager.REGION_FRYSTELAND_ID,[0,0,0,0],0,this.BG_SET_FRYSTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_10_1,1,[450,450],[],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,this.BG_SET_WEST_NAVAL_YARD,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_10_2,1,[450,450],[],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,this.BG_SET_WEST_NAVAL_YARD,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_11_1,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_11_2,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_12_1,1,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_12_2,1,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_12_3,1,[450,450],[],RoomManager.REGION_FORTUNE_CITY_ID,[0,0,0,0],0,this.BG_SET_FORTUNE_CITY,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_13_1,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_13_2,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_13_3,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_14_1,1,[450,450],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_DREAD_PLAINS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_14_2,1,[450,450],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_DREAD_PLAINS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_14_3,1,[450,450],[],RoomManager.REGION_DREAD_PLAINS_ID,[0,0,0,0],0,this.BG_SET_DREAD_PLAINS,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_15_1,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_15_2,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.HOME_15_3,1,[450,450],[],RoomManager.REGION_AFTERLIFE_ID,[0,0,0,0],0,this.BG_SET_AFTERLIFE,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_1_1,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_1_2,8,[450,450],[56],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_1_3,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_1_4,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_1_5,5,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_2_1,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_2_2,8,[450,450],[56],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_2_3,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_2_4,6,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.FACT_2_5,5,[450,450],[],RoomManager.REGION_FACTION_HQ,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_FAR_LEFT,23,[400,450],[155,81],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],35,[RoomManager.BG_WASTELAND_MISSILE_TURRET],null,new MapItemRuleSet(new MapItemRule(2083,330,350,true,445))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_FAR_LEFT_2,9,[400,450],[217,350],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_WASTELAND_HUSK],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_FAR_RIGHT,12,[450,450],[10,49],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_FAR_RIGHT_2,22,[450,450],[53,58,89],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1698,255,544,true,356))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_NIGHTMARE,1,[450,450],[308],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_WASTELAND_NIGHTMARE],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_BASE_FAR,8,[450,450],[38],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GENERAL],null,new MapItemRuleSet(new MapItemRule(1680,564,547,true,351),new MapItemRule(1748,420,442,true,375),new MapItemRule(2364,360,355,true,558),new MapItemRule(2553,750,460,true,643))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_BASE_LEFT,17,[450,450],[3],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GENERAL],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_BASE_RIGHT,20,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],36,[RoomManager.BG_MINETOWER_BASE_SHIELD_GENERATOR],null,new MapItemRuleSet(new MapItemRule(1746,790,455,true,370))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_BASE_OUTSIDE,11,[450,450],[25,303],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GENERAL],RoomManager.MSRS_MINETOWER_BASE_OUTSIDE,new MapItemRuleSet(new MapItemRule(1747,780,275,true,370),new MapItemRule(2713,545,425,true,703))));
        this.roomVersions.push(new RoomManagerRecord(this.GOD_OF_WAR_CHAMBER,1,[450,450],[304],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GOD_OF_WAR_CHAMBER],RoomManager.MSRS_GOD_OF_WAR_CHAMBER,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_LOBBY_LEFT,10,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(2032,225,570,true,423))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_LOBBY_RIGHT,9,[450,450],[24,6],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1699,741,596,true,356),new MapItemRule(2225,530,360,true,479),new MapItemRule(3044,334,467,true,762))));
        this.roomVersions.push(new RoomManagerRecord(this.DAGE_AND_DARKON,1,[450,450],[123,325],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_DAGE_AND_DARKON],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_SUITE_TOP,1,[450,450],[],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],38,[RoomManager.BG_MINETOWER_SUITE],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_SUITE,17,[450,450],[28],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINETOWER_SUITE],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_SUITE_LEFT,19,[450,450],[29,143],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINETOWER_SUITE],null,new MapItemRuleSet(new MapItemRule(2420,350,310,true,587))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_SUITE_ENTRANCE,14,[450,450],[6],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINETOWER_SUITE_ENTRANCE],null,new MapItemRuleSet(new MapItemRule(1700,117,468,true,356),new MapItemRule(2033,113,460,true,423))));
        this.roomVersions.push(new RoomManagerRecord(this.MINETOWER_SURFACE_ENTRANCE,14,[450,450],[33,281],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_WASTELAND_MINETOWER_ENTRANCE_AMMO_DEPOT],null,new MapItemRuleSet(new MapItemRule(1749,191,430,true,375),new MapItemRule(1743,708,437,true,379),new MapItemRule(1726,238,435,true,365),new MapItemRule(2031,275,440,true,423),new MapItemRule(2084,720,435,true,445))));
        this.roomVersions.push(new RoomManagerRecord(this.MINES_GATE,7,[450,450],[46],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GENERAL],null,new MapItemRuleSet(new MapItemRule(1727,720,340,true,365))));
        this.roomVersions.push(new RoomManagerRecord(this.MINES_INNER_CENTER,9,[450,450],[46],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_GENERAL],null,new MapItemRuleSet(new MapItemRule(1670,78,107,true,351),new MapItemRule(2552,575,515,true,643))));
        this.roomVersions.push(new RoomManagerRecord(this.MINES_INNER_LEFT,8,[450,450],[45],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(2250,300,360,true,584),new MapItemRule(2725,304,385,true,719))));
        this.roomVersions.push(new RoomManagerRecord(this.MINES_INNER_RIGHT,12,[450,450],[43],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1235,430,320,true,362))));
        this.roomVersions.push(new RoomManagerRecord(this.MINESTATION_CENTER,14,[450,450],[81,285],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_MINESTATION_TOWER],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.MINESTATION_LEFT,16,[450,450],[37],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1679,779,258,true,351),new MapItemRule(4627,567,411,true,1066))));
        this.roomVersions.push(new RoomManagerRecord(this.MINESTATION_RIGHT,10,[450,450],[6],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.ULYSSES_BUNKER_BACK_LEFT,8,[450,450],[52],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(2085,565,375,true,445))));
        this.roomVersions.push(new RoomManagerRecord(this.ULYSSES_BUNKER_BACK_RIGHT,8,[450,450],[53],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1725,700,400,true,365))));
        this.roomVersions.push(new RoomManagerRecord(this.ULYSSES_BUNKER_FRONT,14,[450,450],[6],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],37,[RoomManager.BG_WASTELAND_ULYSSES_RADAR],null,new MapItemRuleSet(new MapItemRule(1730,839,510,true,372))));
        this.roomVersions.push(new RoomManagerRecord(this.ULYSSES_BUNKER,15,[450,450],[51,118,300],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,this.BG_SET_WASTELAND,null,new MapItemRuleSet(new MapItemRule(1728,830,382,true,372),new MapItemRule(1729,16,272,true,372),new MapItemRule(4698,375,406,true,1068))));
        this.roomVersions.push(new RoomManagerRecord(this.REFINERY_ENTRANCE,15,[450,450],[42],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_MINES_REFINERY_ENTRANCE],null,new MapItemRuleSet(new MapItemRule(2522,720,400,true,632),new MapItemRule(2554,720,396,true,643))));
        this.roomVersions.push(new RoomManagerRecord(this.WASTELAND_SPIDER_DEN,2,[685,470],[221,220],RoomManager.REGION_WASTELAND_ID,[0,0,0,0],0,[RoomManager.BG_WASTELAND_SPIDER_BOSS],null,new MapItemRuleSet(new MapItemRule(1735,700,315,true,369),new MapItemRule(1745,270,435,true,370),new MapItemRule(1750,725,434,true,375))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_ENTRANCE,15,[450,450],[81,253],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],26,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2146,290,571,true,455))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_MIDDLE,14,[450,450],[64,252],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],24,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2593,200,425,true,656))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_SHACK,20,[450,450],[65,254],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],25,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(1696,715,493,true,355),new MapItemRule(2140,659,344,true,461))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_SHACK_RIGHT,3,[450,450],[256,262],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_SHACK_INTERIOR,2,[450,450],[257,258],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2173,135,210,true,459))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_SHACK_INTERIOR_RIGHT,4,[450,450],[251],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2168,718,503,true,461),new MapItemRule(3043,140,480,true,762))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_KRAKEN,4,[450,450],[259],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,1,1],0,[RoomManager.BG_WEST_NAVAL_YARD_KRAKEN],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_KRAKEN_2,2,[450,450],[307,306],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,1,1],0,[RoomManager.BG_WEST_NAVAL_YARD_BEYOND_KRAKEN],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_UNDER_1,4,[450,450],[6,260],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2144,668,449,true,453),new MapItemRule(2138,681,425,true,459),new MapItemRule(2227,440,500,true,481))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_UNDER_2,3,[450,450],[261,255],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],23,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2143,600,460,true,455),new MapItemRule(2231,160,515,true,485))));
        this.roomVersions.push(new RoomManagerRecord(this.NAVAL_YARD_UNDER_3,1,[450,450],[],RoomManager.REGION_WEST_NAVAL_YARD_ID,[0,0,0,0],0,[RoomManager.BG_WEST_NAVAL_YARD_GENERAL],null,new MapItemRuleSet(new MapItemRule(2230,690,430,true,483))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_MAIN,15,[450,450],[81,61],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],16,[RoomManager.BG_OVERLORD_FACILITY_MAIN],null,new MapItemRuleSet(new MapItemRule(2014,500,530,true,420))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_MAIN_LEFT,15,[450,450],[243,6,242],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],0,[RoomManager.BG_OVERLORD_FACILITY_GENERAL],null,new MapItemRuleSet(new MapItemRule(2013,400,510,true,420))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_MAIN_RIGHT,4,[450,450],[245],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],17,[RoomManager.BG_OVERLORD_FACILITY_GENERAL],null,new MapItemRuleSet(new MapItemRule(1995,698,575,true,409),new MapItemRule(2011,380,610,true,415),new MapItemRule(2002,360,520,true,420))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_MAIN_CLIFF,4,[450,450],[246],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],15,[RoomManager.BG_OVERLORD_FACILITY_GENERAL],null,new MapItemRuleSet(new MapItemRule(1993,385,418,true,409),new MapItemRule(2012,310,582,true,415))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_OUTSIDE,15,[450,450],[241,240],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],0,[RoomManager.BG_OVERLORD_FACILITY_OUTSIDE],null,new MapItemRuleSet(new MapItemRule(2728,665,444,true,722))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_BASE,15,[450,450],[244,62],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,0,0],18,[RoomManager.BG_OVERLORD_FACILITY_BASE],null,new MapItemRuleSet(new MapItemRule(1994,800,365,true,409),new MapItemRule(2010,795,518,true,415))));
        this.roomVersions.push(new RoomManagerRecord(this.OVERLORD_THRONE_ROOM,2,[450,450],[229],RoomManager.REGION_OVERLORD_FACILITY_ID,[0,0,1,1],0,[RoomManager.BG_OVERLORD_FACILITY_THRONE_ROOM],null,null));
        this.roomVersions.push(new RoomManagerRecord(this.INFERNAL_MINES,12,[450,470],[126],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],19,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2059,755,482,true,434),new MapItemRule(4129,289,474,true,969),new MapItemRule(4592,312,474,true,1034))));
        this.roomVersions.push(new RoomManagerRecord(this.INFERNAL_MINES_PLATFORM,17,[450,470],[250,6],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,null));
        this.roomVersions.push(new RoomManagerRecord(this.INFERNAL_MINES_MIDDLE,11,[450,470],[74],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,[RoomManager.BG_INFERNAL_MINES_VAULT_BOSS],null,new MapItemRuleSet(new MapItemRule(4131,275,450,true,971))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_RIGHT,9,[450,470],[290],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2060,650,480,true,434))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_RIGHT_2,9,[450,470],[],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],20,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(4132,431,441,true,971),new MapItemRule(4595,420,442,true,1039))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_LEFT,7,[450,470],[],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2297,192,375,true,509),new MapItemRule(2297,192,375,true,519))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_LEFT_2,10,[450,470],[287,288,289],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,RoomManager.MSRS_WAR_INFERNAL_MINES_LEFT_2,new MapItemRuleSet(new MapItemRule(2250,507,427,true,493),new MapItemRule(4593,664,427,true,1034))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_EXILE_VAULT_BROKEN,9,[450,470],[134,145],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2307,64,420,true,509),new MapItemRule(2307,64,420,true,519))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_EXILE_VAULT_2_BROKEN,8,[450,470],[128],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2306,820,377,true,509),new MapItemRule(2306,820,377,true,519))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_EXILE_VAULT_3_BROKEN,7,[450,470],[127],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],0,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(4596,758,407,true,1042))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_INFERNAL_MINES_EXILE_VAULT_4_BROKEN,8,[450,470],[129,130],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],21,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(2719,217,450,true,712),new MapItemRule(4594,616,419,true,1034))));
        this.roomVersions.push(new RoomManagerRecord(this.WAR_DELTA_VAULT_EXILE,7,[450,470],[],RoomManager.REGION_INFERNAL_MINES_ID,[0,0,0,0],22,this.BG_SET_INFERNAL_MINES,null,new MapItemRuleSet(new MapItemRule(4130,325,455,true,971))));

        // Custom
        const merchants = map(this.roomVersions, rv => rv.merchants).flat(1);

        let counts = new Map<number, number>();

        // Lionhart soldiers
        let banned_mercs = [242, 244, 245, 246, 247, 248, 249];

        for (let m = 0, len = merchants.length; m < len; m++) {
            if (findIndex(banned_mercs, v => v === merchants[m]) !== -1) continue;

            const count = counts.get(merchants[m]);

            if (count === undefined) counts.set(merchants[m], 1);
            else counts.set(merchants[m], count + 1);
        }

        const keys = Array.from(counts.keys());

        for (let k = 1; k < keys.length; k++) {
            if (counts.get(k) === 1) this.unique_merchants.push(k);
        }

        this.unique_before = this.unique_merchants;
        // Doesn't end here, it waits until npcbox is initiated.
    }

    static unique_processed = false;
    static unique_merchants:number[] = [];
    static unique_before:number[] = [];

    //#endregion

    static getCurrentRegionId(user: User) {
       let record = this.getRoomRecord(user._currentRoomFileName);

       if(record == null) {
        //   trace("ERROR - getCurrentRegionId, no current regionId for room: " + user._currentRoomFileName);
          return 0;
       }

       return record.regionId;
    }

    static getRegionNameById(regionId: number) {
        switch (regionId) {
            case -2:
               return "Headquarters";
            case -1:
               return "Home";
            case this.REGION_FORTUNE_CITY_ID:
               return this.REGION_FORTUNE_CITY;
            case this.REGION_CENTRAL_STATION_ID:
               return this.REGION_CENTRAL_STATION;
            case this.REGION_WEST_NAVAL_YARD_ID:
               return this.REGION_WEST_NAVAL_YARD;
            case this.REGION_OVERLORD_FACILITY_ID:
               return this.REGION_OVERLORD_FACILITY;
            case this.REGION_BIOLOGICAL_PRESERVE_ID:
               return this.REGION_BIOLOGICAL_PRESERVE;
            case this.REGION_BARRENS_OUTPOST_ID:
               return this.REGION_BARRENS_OUTPOST;
            case this.REGION_WASTELAND_ID:
               return this.REGION_WASTELAND;
            case this.REGION_FRYSTELAND_ID:
               return this.REGION_FRYSTELAND;
            case this.REGION_INFERNAL_MINES_ID:
               return this.REGION_INFERNAL_MINES;
            case this.REGION_DREAD_PLAINS_ID:
               return this.REGION_DREAD_PLAINS;
            case this.REGION_FELDSPAR_FLATS_ID:
               return this.REGION_FELDSPAR_FLATS;
            case this.REGION_AFTERLIFE_ID:
               return this.REGION_AFTERLIFE;
            default:
               return "";
        }
    }

    static getMerchantListInRegion(regionId: number) {
        const list = [];

        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].regionId === regionId) {
                // for (let m = 0, men = this.roomVersions[i].merchants.length; m < men; m++) {
                    list.push(...this.roomVersions[i].merchants);
                // }
            }
        }

        return [...new Set(list)];
    }

    static getAchGroupByRegionId(regionId: number) {
        switch (regionId) {
            case this.REGION_WASTELAND_ID:
               return 9;
            case this.REGION_DREAD_PLAINS_ID:
               return 10;
            case this.REGION_FORTUNE_CITY_ID:
               return 11;
            case this.REGION_BARRENS_OUTPOST_ID:
               return 12;
            case this.REGION_WEST_NAVAL_YARD_ID:
               return 13;
            case this.REGION_OVERLORD_FACILITY_ID:
               return 14;
            case this.REGION_BIOLOGICAL_PRESERVE_ID:
               return 15;
            case this.REGION_CENTRAL_STATION_ID:
               return 16;
            case this.REGION_INFERNAL_MINES_ID:
               return 17;
            case this.REGION_FRYSTELAND_ID:
               return 18;
            case this.REGION_FELDSPAR_FLATS_ID:
               return 0;
            case this.REGION_AFTERLIFE_ID:
               return 0;
            default:
               return 0;
        }
    }

    static getMerchantRoomName(merchantId: number, regionId = 0) {
        if (merchantId === -1) return undefined;

        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (regionId === 0 || regionId === this.roomVersions[i].regionId) {
                for (let m = 0, men = this.roomVersions[i].merchants.length; m < men; m++) {
                    if (this.roomVersions[i].merchants[m] === merchantId) {
                        return this.roomVersions[i].roomName;
                    }
                }
            }
        }

        return undefined;
    }

    static getRegionIdByObjectiveId(objectiveId: number) {
        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].objectiveId === objectiveId) {
                return this.roomVersions[i].regionId;
            }
        }

        return -1;
    }

    static getRoomNameForObjectiveId(objectiveId: number) {
        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].objectiveId === objectiveId) {
                return this.roomVersions[i].roomName;
            }
        }

        return "";
    }

    static getRoomRecord(roomName: string) {
        roomName = roomName.toLowerCase();

        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].roomName.toLowerCase() === roomName) {
                return this.roomVersions[i];
            }
        }

        return undefined;
    }

    static getRoomJumpCoordinates(roomName: string) {
        return this.getRoomRecord(roomName)?.coords;
    }

    static getRoomBaseName(fullRoomName: string) {
        const parts = fullRoomName.split("_");

        if (this.roomIsHome(fullRoomName) || this.roomIsHQ(fullRoomName)) return parts[0] + "_" + parts[1] + "_" + parts[2] + "_" + parts[3];
        
        return parts[0];
    }

    static getRoomFileName(fullRoomName: string) {
        const parts = fullRoomName.split("_");

        if (this.roomIsHome(fullRoomName) || this.roomIsHQ(fullRoomName)) return parts[0] + "_" + parts[1] + "_" + parts[2];
        
        return parts[0];
    }

    static roomIsChallenge(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_1V1_CHAL;
    }

    static roomIsNpc1vs1(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_1V1_NPC;
    }

    static roomIsNpc2vs1_Npc(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_2V1_BOSS_NPC;
    }

    static roomIsNpc2vs1_User(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_2V1_BOSS_USER;
    }

    static roomIs2vs2_User(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_2V2_AUTO;
    }

    static roomIsSim_User(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_SIMULATION;
    }

    static roomIsOMG_User(room: Room) {
        let type = room.getVariable<number>("type");

        return type === Constants.BATTLE_TYPE_OMG;
    }

    static roomIsHQ(roomName: string) {
        return roomName.substring(0, 5) === "FACT_";
    }

    static roomIsHome(roomName: string) {
        return roomName.substring(0, 5) === "FACT_";
    }

    static getRegionObjectiveIds(regionId: number) {
        const list = [];

        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].objectiveId > 0 && this.roomVersions[i].regionId === regionId) {
                list.push(this.roomVersions[i].objectiveId);
            }
        }

        return list;
    }

    // Custom
    /**
     * This will take a Room or the room name with the world index as well.
     */
    static getRoomRecord2(room: Room | string) {
        let rName = this.getRoomBaseName(typeof room === "string" ? room : room.getName());

        return this.getRoomRecord(rName);
    }

    static getRandomRoomRecord(pred?: (room: RoomManagerRecord) => boolean, unique = false) : RoomManagerRecord {
        let rooms = this.roomVersions;

        if (pred !== undefined) {
            let actualRooms = [];

            for (let i = 0, len = rooms.length; i < len; i++) {
                if (pred(rooms[i])) {
                    actualRooms.push(rooms[i]);
                }
            }

            rooms = actualRooms;
        }

        if (unique) {
            let breaker = rooms.length;

            const playerRooms = Array.from(SwarmResources.rooms.values());

            while (breaker-- > 0) {
                if (rooms.length === 0) throw Error("No more available unique room records.");

                const rand = Math.floor(Math.random() * breaker);
                const randRoom = rooms.splice(rand, 1)[0];//rooms[rand];

                for (let i = 0, len = playerRooms.length; i < len; i++) {
                    if (randRoom.roomName.startsWith(playerRooms[i].name)) {
                        continue;
                    }
                }

                return randRoom;
            }
            
            throw Error("No more available unique room records.");
        } else return rooms[Math.floor(Math.random() * rooms.length)];
    }

    static getAllRoomRecordsForMerchant(merchantId: number) : RoomManagerRecord[] {
        const list:RoomManagerRecord[] = [];

        for (let i = 0, len = this.roomVersions.length; i < len; i++) {
            if (this.roomVersions[i].merchants.includes(merchantId)) list.push(this.roomVersions[i]);
        }

        return list;
    }
}

RoomManager["init"]();