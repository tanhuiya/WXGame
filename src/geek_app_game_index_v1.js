/**
 * Created by tanhui on 2018/7/21.
 */

/**
 * 1 可继续作答，2 达到总次数，3 到达单日上限
 * @type {{StateAllow: number, StateOverTotal: number, StateOverToday: number}}
 */
var QuestionStatePermission = {
    StateAllow: 1,
    StateOverTotal: 2,
    StateOverToday: 3,
}

/**
 * 活动类型， 答题 or 测评
 * @type {{Answer: number, Evalution: number}}
 */
var ActivityType = {
    Answer: 1,
    Evalution: 2
}

/**
 * 首页
 * @type {any}
 */
var g_index_layer = cc.Layer.extend({

    activityType_: ActivityType.Answer,

    effectPath_: null,

    introData_: null,

    /**
     * 页面初始化
     */
    init: function () {
        this._super()
        g_index = this
        var bg = geek_lib.f_sprite_create_box(this, res.s_background, g_size.width * 0.5, g_size.height* 0.5, g_size.width, g_size.height, 1, 1)
        var bg_y = bg.getBoundingBox().height
        // 活动介绍
        var rule_btn = geek_lib.f_btn_create(this, res.s_rule, "活动介绍", 30, bg_y - 32, 1, 1, 2, cc.AncorPointTopLeft)
        this.rule_btn_ = rule_btn
        // 排名
        var rank_btn = geek_lib.f_btn_create(this, res.s_rank, "", g_size.width - 32 - 82 , g_size.height, 1, 1, 3, cc.AncorPointTopLeft)
        // rank_btn.setVisible(false)
        this.rank_btn_ = rank_btn

        var music_btn = geek_lib.f_btn_create(this, res.s_music, "", rank_btn.getBoundingBox().x - 14 - 50, g_size.height - 44, 1, 1, 4, cc.AncorPointTopLeft)
        this.music_btn_ = music_btn
        geek_lib.f_sprite_create_box(this, res.s_activity_bg, g_size.width * 0.5, g_size.height - (128 + 281), 692, 562, 2, 5)
        var homebg = geek_lib.f_sprite_create_box(this, res.s_home_bg, g_size.width * 0.5, g_size.height - (128 + 281), 644, 510, 3, 6)
        // geek_lib.f_update_texture(homebg, res.s_head)

        start_btn = geek_lib.f_btn_create(this, res.s_game_start, "", g_size.width * 0.5, 170, 1, 1, 7)
        this.start_btn_ = start_btn

        this.addRichLabel(0)
        this.apiGameState()
        this.apiHomeData()
    },

    /**
     * 添加富文本，当前参加人数
     */
    addRichLabel: function (num) {
        if (this.richLabel_ ){
            this.richLabel_.removeFromParent(true)
        }
        var richText = new ccui.RichText()
        richText.ignoreContentAdaptWithSize(false);
        richText.setContentSize(cc.size(g_size.width, 100));
        var prefix = new ccui.RichElementText(7, cc.color(255,255,255), 255, "当前已有 ", "Helvetica", 30)
        var number = new ccui.RichElementText(8, cc.color(130,89,89), 255, num + "", "Helvetica", 34)
        var sufix = new ccui.RichElementText(9, cc.color(255,255,255), 255, " 人参加", "Helvetica", 30)
        richText.pushBackElement(prefix)
        richText.pushBackElement(number)
        richText.pushBackElement(sufix)
        richText.height = 100
        richText.setTextHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER)
        richText.setPosition(g_size.width * 0.5, this.start_btn_.getBoundingBox().y + 130)
        this.addChild(richText,2,10)
        this.richLabel_ = richText
    },

    /**
     * 开始游戏
     */
    startGame: function () {
        this.apiStartGame()
    },

    /**
     * 显示游戏简介
     */
    showIntroduce: function () {
        geek_lib.f_layer_create_data(this, g_game_introduce_layer, this.introData_, 10, 10)
    },

    /**
     * 显示排行榜
     */
    showRankList:function () {
        geek_lib.f_layer_create_data(this, g_app_game_rank, null, 10, 10)
    },

    /**
     * 背景音乐设置
     */
    toggleEffects: function () {
        geek_lib.f_toggle_back_music(this.effectPath_)
    },

    /**
     * 解析首页数据
     */
    parserHomeData: function (data) {
        if (data.numOfUser) {
            this.addRichLabel(data.numOfUser)
        }
        if (data.musicUrl) {
            this.effectPath_ = data.musicUrl
            // geek_lib.f_play_back_music(data.musicUrl)
        }
        if (data.introButton) {
            this.introData_ = data.introButton
        }
        this.activityType_ = data.activityType
        this.rank_btn_.setVisible(this.activityType_ == ActivityType.Answer)
    },

    /**
     * 按钮被点击的回调
     * @param sender 事件相应者
     * @param type  事件类型
     */
    ctl_button_event: function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            switch (sender) {
                case this.start_btn_:
                    this.startGame()
                    break;
                case this.rule_btn_:
                    this.showIntroduce()
                    break;
                case this.rank_btn_:
                    this.showRankList()
                    break;
                case this.music_btn_:
                    this.toggleEffects()
                    break;
            }
        }
    },

    /**
     * 判断开始游戏的信息
     * @param startData
     */
    gotoQuestion: function (startData) {


        if (startData.countState == QuestionStatePermission.StateAllow) {
            this.removeFromParent();
            geek_lib.f_layer_create_data(g_root, g_question_1_layer, startData, 0, 0)
        } else if (startData.countState == QuestionStatePermission.StateOverTotal) {
            geek_lib.f_show_custom_tip(this, res.s_tip_content_2, "达到游戏次数限制")
        } else if (startData.countState == QuestionStatePermission.StateOverToday) {
            geek_lib.f_show_custom_tip(this, res.s_tip_content_2, "达到游戏今日次数限制")
        }
    },


    // ---- network

    /**
     * 判断活动开始状态
     */
    apiGameState: function () {
        var that = this
        var param = {
            activityId: g_game_user.activity
        }
        geek_lib.f_network_post_json(
            this,
            uri.activityState,
            param,
            function (data) {
                if (data.activityState != 1) {
                    geek_lib.f_show_custom_tip(that, res.s_tip_content_1, "活动已结束")
                }
            })
    },

    /**
     * 获取首页数据
     */
    apiHomeData: function () {
        var that = this
        var param = {
            activityId: g_game_user.activity
        }
        geek_lib.f_network_post_json(
            this,
            uri.home,
            param,
            function (data) {
                that.parserHomeData(data)
            })
    },

    /**
     * 获取游戏信息
     */
    apiStartGame: function () {
        var that = this
        geek_lib.f_network_post_json(
            this,
            uri.startPlay,
            {
                activityId: g_game_user.activity,
                userId: g_game_user.userID
            },
            function (response) {
                // console.log(response)
                if (response.startData) {
                    that.gotoQuestion(response.startData)
                } else {
                    that.errorHandler("startData 数据为空")
                }

            }
        )
    },

    /**
     * 通用错误处理
     */
    errorHandler: function (msg) {

    },
})