"use strict";
const { Model, Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User,{
        foreignKey:'userId'
      })
    }
    static addTodo({ title, dueDate ,userId}) {
      return this.create({ title: title, dueDate: dueDate, completed: false ,userId});
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
    deletetodo() {
      return this.removetask(id);
    }
    static getTodos() {
      return this.findAll({ order: [["id", "ASC"]] });
    }
    static overdue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toLocaleDateString("en-CA"),
          },
          userId,
          completed: false,
          
        },
        
        order: [["id", "ASC"]],
      });
    }
    static completedItems(userId) {
      return this.findAll({
        where: {
          userId,
          completed: true,
          
        },
        order: [["id", "ASC"]],
      });
    }
    static async remove(id,userId) {
      return this.destroy({
        where: {
          id,
          userId
        },
      });
    }
    setCompletionStatus(bool) {
      return this.update({ completed: bool });
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
