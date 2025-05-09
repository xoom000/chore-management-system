const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    choreId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Chores',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('reminder', 'completion', 'verification', 'system'),
      defaultValue: 'reminder'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deliveryMethod: {
      type: DataTypes.ENUM('app', 'email', 'both'),
      defaultValue: 'both'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Notification;
};