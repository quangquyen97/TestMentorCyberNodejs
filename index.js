const express = require("express")
const app = express();

app.use(express.json());
app.use(express.static("."));

app.listen(8080);
let { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()


//user Signup
app.post('/signup', async (req, res) => {
    try {
        let { userName, pass_word, email } = req.body

        // Check duplicate email
        let checkEmail = await prisma.userCyber.findMany({
            where: {
                email
            }
        })
        let data = { userName, pass_word, email }
        if (!checkEmail) {
            let result = await prisma.userCyber.create({
                data
            })
            res.send(result)
        } else {
            res.send('Email đã tồn tại')
        }
    } catch (e) {
        res.send(e)
    }
})




//userLogin
app.post("/login", async (req, res) => {
    let { userName, pass_word } = req.body;
    let data = await prisma.userCyber.findFirst({
        where: {
            userName,
            pass_word
        }
    })
    if (data) {
        res.send('Bạn đã đăng nhập thành công')
    } else {
        res.send('Thông tin đăng nhập không chính xác')
    }
})

//Get list test
app.get('/listTest', async (req, res) => {
    try {
        let data = await prisma.tblQuestions.findMany({
            include: {
                tblAnswer: {}
            }
        });
        res.send(data)
    } catch (e) {
        console.log('Load danh sách câu hỏi thất bại', e)
    }
})

//Chấm điểm
app.post('/checkingAnswer', async (req, res) => {
    try {
        const dataFE = req.body
        const getListAnswer = await prisma.tblAnswer.findMany({
            where: {
                answerTrue: true,
            }
        })

        const getListAnswerByQuestion = await prisma.tblQuestions.findMany({
            include: {
                tblAnswer: {
                    where: {
                        answerTrue: true
                    }
                }
            }
        })
        let score = 0;
        let FeQuestionId = []
        let FeAswerArr = []
        for (let i = 0; i < dataFE.length; i++) {
            FeQuestionId.push(dataFE[i]['idQ'])
            if (dataFE[i]['tblAnswer'].length > 1) {
                FeAswerArr.push(dataFE[i]['tblAnswer'].map(obj => obj.idA))
            }
        }

        let isMultipleAnswerId = [];
        for (let i = 0; i < getListAnswerByQuestion.length; i++) { //lấy idA loại câu hỏi nhiều hoặc 1 đáp án
            if (getListAnswerByQuestion[i]['tblAnswer'].length > 1) {
                isMultipleAnswerId.push(getListAnswerByQuestion[i]['tblAnswer'].map(obj => obj.idA))
            }
        }
        const checkAnswerBySingleQ = ((value, index, arr, dataFE, FeAswerArr) => {
            for (let i = 0; i < arr.length; i++) {
                if (value === arr[i]['idQ']) {

                    if (dataFE[index]['tblAnswer'].length > 1 && dataFE[index]['tblAnswer'].length === arr[i]['tblAnswer'].length) {
                        let isTrue = false;
                        let a = arr[i]['tblAnswer'].map(obj => obj.idA);
                        let iOfAnswer = FeAswerArr.length - 1;
                        let b = FeAswerArr[iOfAnswer].map(obj => obj)
                        for (let j = 0; j < a.length; j++) {
                            for (let k = 0; k < b.length; k++) {
                                if (a[j] == b[k]) {
                                    isTrue = true
                                } else {
                                    break;
                                }

                            }
                        }
                        if (isTrue == true) {
                            score++
                        }
                    } else if (dataFE[index]['tblAnswer'].length === 1) {
                        score++
                    }
                }
            }
        })
        for (let i = 0; i < FeQuestionId.length; i++) {
            checkAnswerBySingleQ(FeQuestionId[i], i, getListAnswerByQuestion, dataFE, FeAswerArr)
        }

        console.log(score)

        res.send(`Điểm của bạn là: ${score}`)
    } catch (e) {
        res.send(e)
    }
})


//GetScoreById
app.get('/score/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let checkIdExist = await prisma.userCyber.count({
            where: {
                id: Number(id)
            }
        })
        console.log(checkIdExist)
        if (checkIdExist) {
            let result = await prisma.userCyber.findMany({
                where: {
                    id: Number(id)
                }, select: {
                    id: true,
                    userName: true,
                    email: true,
                    score: {
                        select: {
                            score: true
                        }
                    }
                }
            })
            res.send(result)
        } else {
            res.send(` ID ${id} không tồn tại `)
        }

    } catch (e) {
        res.send(e)
    }
})