const prisma = require('../prismaClient');


async function createDebt(req, res) {

  try {

    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;


    if (!debtorName || totalAmount == null) {

      return res.status(400).json({

        message:
          'Nome do devedor e valor são obrigatórios'

      });

    }


    const debt = await prisma.debt.create({

      data: {

        debtorName,

        totalAmount:
          parseFloat(totalAmount),

        notes,

        userId:
          req.user.userId

      }

    });


    res.json(debt);


  } catch (error) {

    console.error(error);


    res.status(500).json({

      message:
        'Erro ao criar dívida'

    });

  }

}



async function listDebts(req, res) {
  console.log("USER NO CONTROLLER:");
  console.log(req.user);
  try {


    const debts =
      await prisma.debt.findMany({

        where: {

          userId:
            req.user.userId,

          deletedAt:
            null

        },


        include: {

          payments:true

        },


        orderBy: {

          createdAt:'desc'

        }


      });



    const formattedDebts =
      debts.map((debt)=>{


        const totalPaid =
          debt.payments.reduce(

            (sum,payment)=>

              sum +
              Number(payment.amount),

            0

          );


        const totalOpen =
          Number(debt.totalAmount)
          -
          totalPaid;



        return {

          ...debt,

          totalPaid,

          totalOpen,

          isClosed:
            totalOpen <= 0

        };


      });



    const openDebts =
      formattedDebts.filter(

        debt =>
          !debt.isClosed

      );


    const closedDebts =
      formattedDebts.filter(

        debt =>
          debt.isClosed

      );



    const totalOpen =
      openDebts.reduce(

        (sum,debt)=>

          sum +
          debt.totalOpen,

        0

      );



    const totalPaid =
      formattedDebts.reduce(

        (sum,debt)=>

          sum +
          debt.totalPaid,

        0

      );



    res.json({

      summary:{

        totalOpen,

        totalPaid,

        openCount:
          openDebts.length,

        closedCount:
          closedDebts.length

      },


      debts:
        openDebts,


      closedDebts

    });



  } catch(error){


    console.error(error);


    res.status(500).json({

      message:
        'Erro ao listar dívidas'

    });


  }

}




async function getDebt(req,res){

  try {


    const id =
      parseInt(req.params.id);



    const debt =
      await prisma.debt.findFirst({


        where:{

          id,


          userId:
            req.user.userId,


          deletedAt:
            null

        },


        include:{

          payments:true

        }


      });



    if(!debt){

      return res.status(404).json({

        message:
          'Dívida não encontrada'

      });

    }



    const totalPaid =
      debt.payments.reduce(

        (sum,payment)=>

          sum +
          Number(payment.amount),

        0

      );



    res.json({

      ...debt,


      totalPaid,


      totalOpen:

        Number(debt.totalAmount)
        -
        totalPaid


    });



  }catch(error){


    console.error(error);


    res.status(500).json({

      message:
        'Erro ao buscar dívida'

    });


  }

}




async function updateDebt(req,res){

  try {


    const id =
      parseInt(req.params.id);



    const {
      totalAmount,
      notes
    } = req.body;



    const updated =
      await prisma.debt.update({

        where:{

          id

        },


        data:{


          totalAmount:

            totalAmount !== undefined

            ? parseFloat(totalAmount)

            : undefined,


          notes


        }


      });



    res.json(updated);



  }catch(error){


    console.error(error);


    res.status(500).json({

      message:
        'Erro ao atualizar dívida'

    });


  }

}




async function deleteDebt(req,res){

  try {


    const id =
      parseInt(req.params.id);



    await prisma.debt.update({

      where:{

        id

      },


      data:{

        deletedAt:
          new Date()

      }


    });



    res.json({

      message:
        'Dívida arquivada'

    });



  }catch(error){


    console.error(error);


    res.status(500).json({

      message:
        'Erro ao arquivar dívida'

    });


  }

}



module.exports = {

  createDebt,

  listDebts,

  getDebt,

  updateDebt,

  deleteDebt

};