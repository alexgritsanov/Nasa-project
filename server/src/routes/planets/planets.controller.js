 const { getAllPlanets } = require('../../models/planets.model')


 async function httpGetAllPlanets(req, res) {
    return res.status(200).json(await getAllPlanets());
    // этот код может предотвратить неожиданные баги .  потому что хедер устанавливается один раз  из закрывается. Через возврат мы останавливаем функцию
    // 6: 20  108 lesson
 }

 module.exports = {
   httpGetAllPlanets,
 }