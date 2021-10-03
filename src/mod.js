/**
 * authors: - Wulv
 *          - Revingly
*/

"use strict";

class Mod {
    constructor() {
        this.mod = "Revingly-FoodDrink-Redux";
        this.funcptr = HttpServer.onRespond["IMAGE"];

        Logger.info(`Loading: ${this.mod}`);
        ModLoader.onLoad[this.mod] = this.load.bind(this);
        HttpServer.onRespond["IMAGE"] = this.getImage.bind(this);
        this.itemsToSell = {};
    }

    getImage(sessionID, req, resp, body) {
        const filepath = `${ModLoader.getModPath(this.mod)}res/`;

        if (req.url.includes("/avatar/FoodDrink")) {
            HttpServer.sendFile(resp, `${filepath}FoodDrink.jpg`);
            return;
        }

        this.funcptr(sessionID, req, resp, body);
    }
	


    load() {
        Logger.info(`Loading: ${this.mod}`);

        const filepath = `${ModLoader.getModPath(this.mod)}db/`;

        DatabaseServer.tables.traders.FoodDrink = {
            "assort": this.createFoodAndDrinkAssortTable(),
            "base": JsonUtil.deserialize(VFS.readFile(`${filepath}base.json`))
        };

        let locales = DatabaseServer.tables.locales.global;

        for (const locale in locales) {
            locales[locale].trading.FoodDrink = {
                "FullName": "Food & Drink",
                "FirstName": "Food & Drink",
                "Nickname": "Food & Drink",
                "Location": "Near the Ultra Shopping Mall",
                "Description": "Get your food and drink here! This shop is one the few grocey store still open in Tarkov. Its has a wide variety of products, surprinsingly..."
            };
        }

        DatabaseServer.tables.locales.global = locales;
    }

    createFoodAndDrinkAssortTable() {
        const { set_original_prices, prices_multiplier, enable_trader_levels } = require('./config.json');
        const FOOD_ID = "5448e8d04bdc2ddf718b4569";
        const WATER_ID = "5448e8d64bdc2dce718b4568";
        const FOOD_CONTAINER_ID = "5c093db286f7740a1b2617e3";
        const ROUBLE_ID = "5449016a4bdc2d6f028b456f";
        const items = DatabaseServer.tables.templates.items;
		const TopTierFood = [
			"5734773724597737fd047c14", //Condensed Milk
			"590c5d4b86f774784e1b9c45", //Iskra Lunch box
			"590c5f0d86f77413997acfab", //MRE Ration
			"60098b1705871270cd5352a1", //Emergency Water Ration
			"5c0fa877d174af02a012e1cf", //Aquamarine water bottle
			"5e8f3423fd7471236e6e3b64", //Premium Kvass bottle
			"5bc9b156d4351e00367fbce9", //Jar of Devil mayo
			"5d1b33a686f7742523398398", //Purified Water
			"5d1b376e86f774252519444e", //Fierce Hatchling moonshine
			"5d40407c86f774318526545a", //Tarkovskaya vodka
			"60b0f93284c20f0feb453da7", //RatCola can
		];
		const GoodFood = [
			"57347d5f245977448b40fa81", //Can of humpback salmon
			"57347da92459774491567cf5", //Large can of beef stew
			"57347d7224597744596b4e72", //Small can of beef stew
			"57347d9c245977448b40fa85", //Can of herring
			"57347d8724597744596b4e76", //Can of Squash spread
			"59e3577886f774176a362503", //Pack of Sugar
			"57347d90245977448f7b7f65", //Pack of oat flakes
			"5448fee04bdc2dbc018b4567", //0.6 liter water bottle
			"57513f9324597720a7128161", //Grand Juice
			"5751435d24597720a27126d1", //Max energy drink
			"575146b724597720a27126d5", //Pack of Milk
			"5751496424597720a27126da", //Hot rod energy drink
			"5bc9c29cd4351e003562b8a3", //Can of sprats
		];
		const JunkFood = [
			"5448ff904bdc2d6f028b456e", //Army Crackers
			"544fb6cc4bdc2d34748b456e", //Slickers
			"5751487e245977207e26a315", //Emelya rye croutons
			"57347d3d245977448f7b7f61", //rye croutons
			"57347d692459774491567cf1", //Can of green peas
			"57505f6224597709a92585a9", //Alyonka chocolate bar
			"575062b524597720a31c09a1", //Green Ice tea
			"544fb62a4bdc2dfb738b4568", //Russian Army Apple juice
			"57514643245977207f2c2d09", //TarCola can
			"57513f07245977207e26a311", //Applce Juice
			"5d403f9186f7743cac3f229b", //Dan Jackiel whiskey
			"5673de654bdc2d180f8b456d", //Can of pacific saury
			"57513fcc24597720a31c09a6", //Vita Juice
		];
		
		
		//if set_original_prices is true, the prices remain unchanged, if false, the price will be multiplied by prices_multiplier.
        if(set_original_prices)
			Logger.log(`[${this.mod}] The original_prices is true`)
		else
			Logger.log(`[${this.mod}] The prices_multiplier is ${prices_multiplier} and true`)
		if(enable_trader_levels)
			Logger.log(`[${this.mod}] The trader Levels are enabled`)
		else
			Logger.log(`[${this.mod}] The trader Levels are disbabled`)
			
		
        return Object
            .values(items)
            .filter(item => item._parent === FOOD_ID || item._parent === WATER_ID || item._id === FOOD_CONTAINER_ID)
            .map(item => {
                return {
                    "_id": HashUtil.generate(),
                    "_tpl": item._id,
                    "parentId": "hideout",
                    "slotId": "hideout",
                    "upd": {
                        "UnlimitedCount": true,
                        "StackObjectsCount": 999999999
                    }
                }
            })
            .reduce(
			(acc, item) => {
                acc.items.push(item);
				const original_price = items[item._tpl]._props.CreditsPrice;
                acc.barter_scheme[item._id] = [
                    [
                        {
							//This function is basically a fusion between square root and linear curve.
							//For example, the icebag that originally cost around 500k, is now worth around 600k, and the rye croutons that normally cost 300,
							//now cost around 50k (with the prices_multiplier set by default in the conf). Using this method, the prices of all food are now fair, and also make
							//the game more difficult.
                            "count": (set_original_prices ? original_price : Math.round(Math.sqrt(original_price) * 500 * prices_multiplier + original_price / 1.5)) ,
                            "_tpl": ROUBLE_ID
                        }
                    ]
                ];
				if(enable_trader_levels) {
					if (TopTierFood.includes(item._tpl))
						acc.loyal_level_items[item._id] = 3;
					else if (GoodFood.includes(item._tpl))
						acc.loyal_level_items[item._id] = 2;
					else 
						acc.loyal_level_items[item._id] = 1;
                }
				else
					acc.loyal_level_items[item._id] = 1;
                
				return acc;
			},
                {
                    items: [], 
					barter_scheme: {}, 
					loyal_level_items: {}
                }
            );
    }
}

module.exports.Mod = Mod;
